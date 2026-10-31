<?php

namespace App\Controller;

use App\Entity\Client;
use App\Entity\User;
use App\Http\JsonInput;
use App\Repository\ClientRepository;
use App\Repository\PatientRepository;
use App\Repository\AttentionRepository;
use App\Repository\VaccineReminderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/clients')]
final class ClientController extends AbstractController
{
    #[Route('', name: 'api_clients_list', methods: ['GET'])]
    public function list(Request $request, ClientRepository $clients, AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        if (!$owner instanceof User) {
            return $this->json(['error' => 'unauthenticated'], 401);
        }

        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 20)));
        $result = $clients->searchOwnedBy(
            $owner,
            trim($request->query->getString('q')),
            $request->query->getBoolean('includeArchived'),
            $page,
            $limit,
        );

        return $this->json([
            'items' => array_map(fn (Client $client) => $this->clientData($client, $attentions), $result['items']),
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $result['total']],
        ]);
    }

    #[Route('', name: 'api_clients_create', methods: ['POST'])]
    public function create(Request $request, JsonInput $input, AttentionRepository $attentions, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        if (!$owner instanceof User) {
            return $this->json(['error' => 'unauthenticated'], 401);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: true);
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $client = new Client($owner, (string) $data['name'], (string) $data['surname'], (string) $data['phone']);
        $client->update($data);
        $entities->persist($client);
        $entities->flush();

        return $this->json($this->clientData($client, $attentions), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id<\\d+>}', name: 'api_clients_show', methods: ['GET'])]
    public function show(int $id, ClientRepository $clients, PatientRepository $patients, AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $client = $owner instanceof User ? $clients->findOwnedBy($id, $owner) : null;
        if (!$client instanceof Client) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $this->clientData($client, $attentions);
        $data['patients'] = array_map($this->patientData(...), $patients->findForClient($client));
        $data['attentions'] = array_map(static fn (\App\Entity\Attention $attention) => [
            'id' => $attention->getId(),
            'patientId' => $attention->getPatient()->getId(),
            'patientName' => $attention->getPatient()->getName(),
            'dateTime' => $attention->getDateTime()->format(DATE_ATOM),
            'types' => $attention->getTypes(),
            'chargedAmount' => $attention->getChargedAmount(),
            'debtAmount' => $attention->getDebtAmount(),
            'reason' => $attention->getReason(),
            'observations' => $attention->getObservations(),
        ], $attentions->findForClient($client));

        return $this->json($data);
    }

    #[Route('/{id<\\d+>}', name: 'api_clients_update', methods: ['PATCH'])]
    public function update(int $id, Request $request, JsonInput $input, ClientRepository $clients, AttentionRepository $attentions, VaccineReminderRepository $reminders, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $client = $owner instanceof User ? $clients->findOwnedBy($id, $owner) : null;
        if (!$client instanceof Client) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: false);
        if (array_key_exists('remindersOptOut', $data) && !is_bool($data['remindersOptOut'])) $errors['remindersOptOut'] = 'La preferencia de baja no es válida.';
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $client->update($data);
        if ($client->hasOptedOutOfReminders()) {
            foreach ($reminders->findForClient($client) as $reminder) $reminder->cancel();
        }
        $entities->flush();

        return $this->json($this->clientData($client, $attentions));
    }

    #[Route('/{id<\\d+>}', name: 'api_clients_archive', methods: ['DELETE'])]
    public function archive(int $id, ClientRepository $clients, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $client = $owner instanceof User ? $clients->findOwnedBy($id, $owner) : null;
        if (!$client instanceof Client) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $client->archive();
        $entities->flush();

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function currentVeterinarian(): ?User
    {
        $user = $this->getUser();

        return $user instanceof User ? $user : null;
    }

    private function validate(array $data, bool $creating): array
    {
        $errors = [];
        foreach (['name' => 'Nombre', 'surname' => 'Apellido', 'phone' => 'Teléfono'] as $field => $label) {
            if (($creating || array_key_exists($field, $data)) && trim((string) ($data[$field] ?? '')) === '') {
                $errors[$field] = $label.' es obligatorio.';
            }
        }
        if (array_key_exists('email', $data) && $data['email'] !== null && $data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Ingresá un email válido.';
        }

        return $errors;
    }

    #[Route('/debts', name: 'api_clients_debts', methods: ['GET'])]
    public function debts(AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        if (!$owner instanceof User) return $this->json(['error' => 'unauthenticated'], 401);
        return $this->json(array_map(fn (array $row) => $this->clientData($row[0], $attentions), $attentions->clientsWithDebt($owner)));
    }

    private function clientData(Client $client, AttentionRepository $attentions): array
    {
        return [
            'id' => $client->getId(),
            'name' => $client->getName(),
            'surname' => $client->getSurname(),
            'phone' => $client->getPhone(),
            'email' => $client->getEmail(),
            'emailMissing' => $client->getEmail() === null,
            'remindersOptOut' => $client->hasOptedOutOfReminders(),
            'address' => $client->getAddress(),
            'notes' => $client->getNotes(),
            'archived' => $client->isArchived(),
            'debtTotal' => $attentions->debtForClient($client),
            'createdAt' => $client->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $client->getUpdatedAt()->format(DATE_ATOM),
        ];
    }

    private function patientData(\App\Entity\Patient $patient): array
    {
        return [
            'id' => $patient->getId(),
            'name' => $patient->getName(),
            'species' => $patient->getSpecies(),
            'breed' => $patient->getBreed(),
            'sex' => $patient->getSex(),
            'birthDate' => $patient->getBirthDate()?->format('Y-m-d'),
            'approximateAge' => $patient->getApproximateAge(),
            'castrated' => $patient->isCastrated(),
            'archived' => $patient->isArchived(),
            'deceased' => $patient->isDeceased(),
        ];
    }
}
