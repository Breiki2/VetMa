<?php

namespace App\Controller;

use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\User;
use App\Http\JsonInput;
use App\Repository\ClientRepository;
use App\Repository\PatientRepository;
use App\Repository\AttentionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class PatientController extends AbstractController
{
    #[Route('/api/clients/{clientId<\\d+>}/patients', name: 'api_patients_list', methods: ['GET'])]
    public function listForClient(int $clientId, ClientRepository $clients, PatientRepository $patients): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $client = $owner instanceof User ? $clients->findOwnedBy($clientId, $owner) : null;
        if (!$client instanceof Client) {
            return $this->json(['error' => 'not_found'], 404);
        }

        return $this->json(['items' => array_map($this->patientData(...), $patients->findForClient($client))]);
    }

    #[Route('/api/clients/{clientId<\\d+>}/patients', name: 'api_patients_create', methods: ['POST'])]
    public function createForClient(int $clientId, Request $request, JsonInput $input, ClientRepository $clients, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $client = $owner instanceof User ? $clients->findOwnedBy($clientId, $owner) : null;
        if (!$client instanceof Client) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: true);
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $patient = new Patient($client, (string) $data['name'], (string) $data['species'], (string) $data['sex'], $data['castrated']);
        $patient->update($this->normalized($data));
        $entities->persist($patient);
        $entities->flush();

        return $this->json($this->patientData($patient), JsonResponse::HTTP_CREATED);
    }

    #[Route('/api/patients/{id<\\d+>}', name: 'api_patients_show', methods: ['GET'])]
    public function show(int $id, PatientRepository $patients, AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $patient = $owner instanceof User ? $patients->findOwnedBy($id, $owner) : null;
        if (!$patient instanceof Patient) {
            return $this->json(['error' => 'not_found'], 404);
        }

        return $this->json($this->patientData($patient) + [
            'client' => ['id' => $patient->getClient()->getId(), 'name' => $patient->getClient()->getName(), 'surname' => $patient->getClient()->getSurname()],
            'attentions' => array_map(static fn (\App\Entity\Attention $attention) => ['id' => $attention->getId(), 'dateTime' => $attention->getDateTime()->format(DATE_ATOM), 'types' => $attention->getTypes(), 'reason' => $attention->getReason(), 'observations' => $attention->getObservations(), 'chargedAmount' => $attention->getChargedAmount(), 'debtAmount' => $attention->getDebtAmount()], $attentions->findForPatient($patient)),
            'vaccines' => array_values(array_map(static fn (\App\Entity\VaccineApplication $application) => [
                'id' => $application->getId(),
                'vaccineId' => $application->getVaccine()->getId(),
                'name' => $application->getVaccine()->getName(),
                'appliedAt' => $application->getAppliedAt()->format(DATE_ATOM),
                'batchNumber' => $application->getBatchNumber(),
                'observations' => $application->getObservations(),
            ], array_merge(...array_map(static fn (\App\Entity\Attention $attention) => $attention->getVaccineApplications()->toArray(), $attentions->findForPatient($patient))))),
        ]);
    }

    #[Route('/api/patients/{id<\\d+>}', name: 'api_patients_update', methods: ['PATCH'])]
    public function update(int $id, Request $request, JsonInput $input, PatientRepository $patients, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $patient = $owner instanceof User ? $patients->findOwnedBy($id, $owner) : null;
        if (!$patient instanceof Patient) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: false, current: $patient);
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $patient->update($this->normalized($data));
        $entities->flush();

        return $this->json($this->patientData($patient));
    }

    #[Route('/api/patients/{id<\\d+>}', name: 'api_patients_archive', methods: ['DELETE'])]
    public function archive(int $id, PatientRepository $patients, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->currentVeterinarian();
        $patient = $owner instanceof User ? $patients->findOwnedBy($id, $owner) : null;
        if (!$patient instanceof Patient) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $patient->archive();
        $entities->flush();

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function currentVeterinarian(): ?User
    {
        $user = $this->getUser();

        return $user instanceof User ? $user : null;
    }

    private function validate(array $data, bool $creating, ?Patient $current = null): array
    {
        $values = $current === null ? $data : array_merge([
            'name' => $current->getName(),
            'species' => $current->getSpecies(),
            'sex' => $current->getSex(),
            'birthDate' => $current->getBirthDate()?->format('Y-m-d'),
            'approximateAge' => $current->getApproximateAge(),
            'castrated' => $current->isCastrated(),
        ], $data);
        $errors = [];

        foreach (['name' => 'El nombre es obligatorio.'] as $field => $message) {
            if (($creating || array_key_exists($field, $data)) && trim((string) ($values[$field] ?? '')) === '') {
                $errors[$field] = $message;
            }
        }
        if (!in_array($values['species'] ?? null, ['dog', 'cat'], true)) {
            $errors['species'] = 'La especie debe ser dog o cat.';
        }
        if (!in_array($values['sex'] ?? null, ['female', 'male', 'unknown'], true)) {
            $errors['sex'] = 'El sexo no es válido.';
        }
        if (!is_bool($values['castrated'] ?? null)) {
            $errors['castrated'] = 'Indicá si el paciente está castrado.';
        }

        $birthDate = $values['birthDate'] ?? null;
        $approximateAge = trim((string) ($values['approximateAge'] ?? ''));
        if (($birthDate === null || $birthDate === '') && $approximateAge === '') {
            $errors['birthDate'] = 'Indicá la fecha de nacimiento o la edad aproximada.';
        }
        if ($birthDate !== null && $birthDate !== '') {
            $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', (string) $birthDate);
            $dateErrors = \DateTimeImmutable::getLastErrors();
            if (!$parsed || ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) || $parsed > new \DateTimeImmutable('today')) {
                $errors['birthDate'] = 'La fecha de nacimiento no es válida.';
            }
        }
        if (mb_strlen((string) ($values['breed'] ?? '')) > 120 || mb_strlen($approximateAge) > 80) {
            $errors['breed'] = 'La raza o edad aproximada excede el largo permitido.';
        }
        foreach (['archived', 'deceased'] as $flag) {
            if (array_key_exists($flag, $data) && !is_bool($data[$flag])) {
                $errors[$flag] = 'El valor debe ser verdadero o falso.';
            }
        }

        return $errors;
    }

    private function normalized(array $data): array
    {
        if (array_key_exists('birthDate', $data)) {
            $data['birthDate'] = $data['birthDate'] === null || $data['birthDate'] === ''
                ? null
                : new \DateTimeImmutable((string) $data['birthDate']);
        }

        return $data;
    }

    private function patientData(Patient $patient): array
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
            'createdAt' => $patient->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $patient->getUpdatedAt()->format(DATE_ATOM),
        ];
    }
}
