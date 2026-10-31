<?php

namespace App\Attention;

use App\Entity\Attention;
use App\Entity\Patient;
use App\Entity\Vaccine;
use App\Entity\VaccineApplication;
use App\Repository\VaccineRepository;
use Doctrine\ORM\EntityManagerInterface;

final class AttentionRegistration
{
    public function __construct(
        private readonly VaccineRepository $vaccines,
        private readonly EntityManagerInterface $entities,
    ) {
    }

    public function create(Patient $patient, array $data): AttentionRegistrationResult
    {
        $errors = $this->validate($data, creating: true);
        if ($errors !== []) {
            return AttentionRegistrationResult::failure($errors);
        }

        $applications = $this->applications($data, $patient, $errors);
        if ($errors !== []) {
            return AttentionRegistrationResult::failure($errors);
        }

        $dateTime = new \DateTimeImmutable($data['dateTime'] ?? 'now');
        $attention = new Attention($patient, $dateTime, $data['types']);
        $attention->update($this->normalized($data, $dateTime));
        foreach ($applications as $application) {
            $attention->addVaccineApplication($application);
        }

        $this->entities->persist($attention);
        $this->entities->flush();

        return AttentionRegistrationResult::success($attention);
    }

    public function update(Attention $attention, array $data): AttentionRegistrationResult
    {
        $errors = $this->validate($data, creating: false, current: $attention);
        $applications = $this->applications($data, $attention->getPatient(), $errors);
        if ($errors !== []) {
            return AttentionRegistrationResult::failure($errors);
        }

        $dateTime = isset($data['dateTime']) ? new \DateTimeImmutable($data['dateTime']) : $attention->getDateTime();
        $attention->update($this->normalized($data, $dateTime));
        if (array_key_exists('vaccineApplications', $data)) {
            $attention->clearVaccineApplications();
            foreach ($applications as $application) {
                $attention->addVaccineApplication($application);
            }
        }

        $this->entities->flush();

        return AttentionRegistrationResult::success($attention);
    }

    private function validate(array $data, bool $creating, ?Attention $current = null): array
    {
        $types = $data['types'] ?? $current?->getTypes();
        $typeList = is_array($types) ? $types : [];
        $errors = [];

        if (!is_array($types) || $types === [] || array_diff($typeList, ['vacuna', 'ecografia', 'atencion']) !== []) {
            $errors['types'] = 'Seleccioná al menos un tipo válido.';
        }

        foreach (['chargedAmount', 'debtAmount'] as $field) {
            if (array_key_exists($field, $data) && (!is_string($data[$field]) && !is_int($data[$field]) || !preg_match('/^\d{1,10}(?:\.\d{1,2})?$/', (string) $data[$field]))) {
                $errors[$field] = 'Ingresá un monto no negativo con hasta dos decimales.';
            }
        }

        if (array_key_exists('ultrasoundReport', $data) && !is_string($data['ultrasoundReport']) && $data['ultrasoundReport'] !== null) {
            $errors['ultrasoundReport'] = 'El informe debe ser texto.';
        }
        if (array_key_exists('ultrasoundReport', $data) && !in_array('ecografia', $typeList, true) && trim((string) $data['ultrasoundReport']) !== '') {
            $errors['ultrasoundReport'] = 'El informe solo corresponde a una ecografía.';
        }

        if ($creating || array_key_exists('dateTime', $data)) {
            try {
                new \DateTimeImmutable($data['dateTime'] ?? 'now');
            } catch (\Throwable) {
                $errors['dateTime'] = 'La fecha y hora no son válidas.';
            }
        }

        if (in_array('vacuna', $typeList, true) && !array_key_exists('vaccineApplications', $data) && ($creating || $current?->getVaccineApplications()->count() === 0)) {
            $errors['vaccineApplications'] = 'Agregá al menos una vacuna aplicada.';
        }
        if (array_key_exists('vaccineApplications', $data) && (!is_array($data['vaccineApplications']) || (in_array('vacuna', $typeList, true) && $data['vaccineApplications'] === []))) {
            $errors['vaccineApplications'] = 'Indicá las vacunas aplicadas.';
        }

        return $errors;
    }

    /** @param array<string, mixed> $data
     *  @param array<string, string> $errors
     *  @return list<VaccineApplication>
     */
    private function applications(array $data, Patient $patient, array &$errors): array
    {
        if (array_key_exists('vaccineApplications', $data) && !is_array($data['vaccineApplications'])) {
            return [];
        }

        $result = [];
        foreach ($data['vaccineApplications'] ?? [] as $item) {
            if (!is_array($item) || !isset($item['vaccineId']) || !is_numeric($item['vaccineId'])) {
                $errors['vaccineApplications'] = 'Cada aplicación requiere una vacuna válida.';
                return [];
            }

            $vaccine = $this->vaccines->find((int) $item['vaccineId']);
            if (!$vaccine instanceof Vaccine || !$vaccine->isActive() || !in_array($vaccine->getSpecies(), [$patient->getSpecies(), 'both'], true)) {
                $errors['vaccineApplications'] = 'La vacuna no está disponible para esta especie.';
                return [];
            }

            try {
                $appliedAt = new \DateTimeImmutable($item['appliedAt'] ?? ($data['dateTime'] ?? 'now'));
            } catch (\Throwable) {
                $errors['vaccineApplications'] = 'La fecha de aplicación no es válida.';
                return [];
            }

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
}
