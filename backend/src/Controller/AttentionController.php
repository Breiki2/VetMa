<?php

namespace App\Controller;

use App\Entity\Attention;
use App\Entity\Patient;
use App\Entity\User;
use App\Entity\Vaccine;
use App\Entity\VaccineApplication;
use App\Http\JsonInput;
use App\Repository\AttentionRepository;
use App\Repository\PatientRepository;
use App\Repository\VaccineRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class AttentionController extends AbstractController
{
    #[Route('/api/patients/{patientId<\\d+>}/attentions', methods: ['GET'])]
    public function list(int $patientId, PatientRepository $patients, AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->getUser();
        $patient = $owner instanceof User ? $patients->findOwnedBy($patientId, $owner) : null;
        if (!$patient instanceof Patient) return $this->json(['error' => 'not_found'], 404);

        return $this->json(array_map($this->data(...), $attentions->findForPatient($patient)));
    }

    #[Route('/api/patients/{patientId<\\d+>}/attentions', methods: ['POST'])]
    public function create(int $patientId, Request $request, JsonInput $input, PatientRepository $patients, VaccineRepository $vaccines, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        $patient = $owner instanceof User ? $patients->findOwnedBy($patientId, $owner) : null;
        if (!$patient instanceof Patient) return $this->json(['error' => 'not_found'], 404);
        $data = $input->read($request);
        $errors = $this->validate($data, true);
        if ($errors !== []) return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);

        $applications = $this->applications($data, $patient, $vaccines, $errors);
        if ($errors !== []) return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        $dateTime = new \DateTimeImmutable($data['dateTime'] ?? 'now');
        $attention = new Attention($patient, $dateTime, $data['types']);
        $attention->update($this->normalized($data, $dateTime));
        foreach ($applications as $application) $attention->addVaccineApplication($application);
        $entities->persist($attention);
        $entities->flush();
        return $this->json($this->data($attention), 201);
    }

    #[Route('/api/attentions/{id<\\d+>}', methods: ['PATCH'])]
    public function update(int $id, Request $request, JsonInput $input, AttentionRepository $attentions, VaccineRepository $vaccines, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        $attention = $owner instanceof User ? $attentions->findOwnedBy($id, $owner) : null;
        if (!$attention instanceof Attention) return $this->json(['error' => 'not_found'], 404);
        $data = $input->read($request);
        $errors = $this->validate($data, false, $attention);
        $applications = $this->applications($data, $attention->getPatient(), $vaccines, $errors);
        if ($errors !== []) return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        $dateTime = isset($data['dateTime']) ? new \DateTimeImmutable($data['dateTime']) : $attention->getDateTime();
        $attention->update($this->normalized($data, $dateTime));
        if (array_key_exists('vaccineApplications', $data)) {
            $attention->clearVaccineApplications();
            foreach ($applications as $application) $attention->addVaccineApplication($application);
        }
        $entities->flush();
        return $this->json($this->data($attention));
    }

    #[Route('/api/attentions/{id<\\d+>}', methods: ['DELETE'])]
    public function delete(int $id, AttentionRepository $attentions, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        $attention = $owner instanceof User ? $attentions->findOwnedBy($id, $owner) : null;
        if (!$attention instanceof Attention) return $this->json(['error' => 'not_found'], 404);
        $entities->remove($attention); $entities->flush();
        return $this->json(null, 204);
    }

    private function validate(array $data, bool $creating, ?Attention $current = null): array
    {
        $types = $data['types'] ?? $current?->getTypes();
        $typeList = is_array($types) ? $types : [];
        $errors = [];
        if (!is_array($types) || $types === [] || array_diff($typeList, ['vacuna', 'ecografia', 'atencion']) !== []) $errors['types'] = 'Seleccioná al menos un tipo válido.';
        foreach (['chargedAmount', 'debtAmount'] as $field) {
            if (array_key_exists($field, $data) && (!is_string($data[$field]) && !is_int($data[$field]) || !preg_match('/^\\d{1,10}(?:\\.\\d{1,2})?$/', (string) $data[$field]))) $errors[$field] = 'Ingresá un monto no negativo con hasta dos decimales.';
        }
        if ($creating || array_key_exists('dateTime', $data)) {
            try { new \DateTimeImmutable($data['dateTime'] ?? 'now'); } catch (\Throwable) { $errors['dateTime'] = 'La fecha y hora no son válidas.'; }
        }
        if (in_array('vacuna', $typeList, true) && !array_key_exists('vaccineApplications', $data) && ($creating || $current?->getVaccineApplications()->count() === 0)) $errors['vaccineApplications'] = 'Agregá al menos una vacuna aplicada.';
        if (array_key_exists('vaccineApplications', $data) && (!is_array($data['vaccineApplications']) || (in_array('vacuna', $typeList, true) && $data['vaccineApplications'] === []))) $errors['vaccineApplications'] = 'Indicá las vacunas aplicadas.';
        return $errors;
    }

    private function applications(array $data, Patient $patient, VaccineRepository $vaccines, array &$errors): array
    {
        if (array_key_exists('vaccineApplications', $data) && !is_array($data['vaccineApplications'])) return [];
        $result = [];
        foreach ($data['vaccineApplications'] ?? [] as $index => $item) {
            if (!is_array($item) || !isset($item['vaccineId']) || !is_numeric($item['vaccineId'])) { $errors['vaccineApplications'] = 'Cada aplicación requiere una vacuna válida.'; return []; }
            $vaccine = $vaccines->find((int) $item['vaccineId']);
            if (!$vaccine instanceof Vaccine || !$vaccine->isActive() || !in_array($vaccine->getSpecies(), [$patient->getSpecies(), 'both'], true)) { $errors['vaccineApplications'] = 'La vacuna no está disponible para esta especie.'; return []; }
            try { $appliedAt = new \DateTimeImmutable($item['appliedAt'] ?? ($data['dateTime'] ?? 'now')); } catch (\Throwable) { $errors['vaccineApplications'] = 'La fecha de aplicación no es válida.'; return []; }
            $application = new VaccineApplication($vaccine, $appliedAt);
            $application->update($item);
            $result[] = $application;
        }
        return $result;
    }

    private function normalized(array $data, \DateTimeImmutable $dateTime): array
    {
        $data['dateTime'] = $dateTime;
        return $data;
    }

    private function data(Attention $attention): array
    {
        return ['id' => $attention->getId(), 'patientId' => $attention->getPatient()->getId(), 'dateTime' => $attention->getDateTime()->format(DATE_ATOM), 'types' => $attention->getTypes(), 'reason' => $attention->getReason(), 'observations' => $attention->getObservations(), 'chargedAmount' => $attention->getChargedAmount(), 'debtAmount' => $attention->getDebtAmount(), 'vaccineApplications' => array_map(static fn (VaccineApplication $a) => ['id' => $a->getId(), 'vaccineId' => $a->getVaccine()->getId(), 'vaccineName' => $a->getVaccine()->getName(), 'appliedAt' => $a->getAppliedAt()->format(DATE_ATOM), 'batchNumber' => $a->getBatchNumber(), 'observations' => $a->getObservations()], $attention->getVaccineApplications()->toArray())];
    }
}
