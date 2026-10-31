<?php

namespace App\Tests\Controller;

use App\Entity\Attention;
use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\Vaccine;
use App\Entity\VaccineApplication;
use App\Entity\VaccineReminder;
use App\Tests\ApiWebTestCase;

final class SearchPerformanceTest extends ApiWebTestCase
{
    public function testSearchesAndOperationalListsStayFastAndPaginatedAtOneThousandPatients(): void
    {
        $owner = $this->createUser();
        $other = $this->createUser('other@example.test');
        $vaccine = new Vaccine('Triple felina', 'cat');
        $this->entityManager->persist($vaccine);
        for ($i = 0; $i < 1000; $i++) {
            $client = new Client($owner, sprintf('Cliente %04d', $i), 'Apellido', '11'.str_pad((string) $i, 8, '0', STR_PAD_LEFT));
            $client->update(['email' => sprintf('cliente%04d@example.test', $i)]);
            $patient = new Patient($client, sprintf('Paciente %04d', $i), 'cat', 'female', true);
            $patient->update(['approximateAge' => '2 años']);
            $attention = new Attention($patient, new \DateTimeImmutable('2026-01-01'), ['vacuna']);
            $attention->update(['debtAmount' => '12.00']);
            $application = new VaccineApplication($vaccine, new \DateTimeImmutable('2026-01-01'));
            $attention->addVaccineApplication($application);
            $reminder = new VaccineReminder($application, new \DateTimeImmutable('2027-01-01'));
            $application->setReminder($reminder);
            $this->entityManager->persist($client);
            $this->entityManager->persist($patient);
            $this->entityManager->persist($attention);
            $this->entityManager->persist($application);
            $this->entityManager->persist($reminder);
        }
        $foreignClient = new Client($other, 'Sin coincidencia', 'Cliente 0999', '119999');
        $foreignPatient = new Patient($foreignClient, 'Paciente 0999', 'cat', 'female', true);
        $foreignPatient->update(['approximateAge' => '2 años']);
        $this->entityManager->persist($foreignClient);
        $this->entityManager->persist($foreignPatient);
        $this->entityManager->flush();
        $this->logIn();

        $clientTime = $this->timedRequest('/api/clients?q=cliente%200999&limit=20');
        self::assertSame(1, $clientTime['payload']['pagination']['total']);
        self::assertLessThan(2.0, $clientTime['seconds']);

        $patientTime = $this->timedRequest('/api/patients?q=paciente%200999&page=1&limit=20');
        self::assertSame(1, $patientTime['payload']['pagination']['total']);
        self::assertSame('Cliente 0999 Apellido', $patientTime['payload']['items'][0]['clientName']);
        self::assertLessThan(2.0, $patientTime['seconds']);

        $debtTime = $this->timedRequest('/api/clients/debts?page=2&limit=20');
        self::assertSame(1000, $debtTime['payload']['pagination']['total']);
        self::assertCount(20, $debtTime['payload']['items']);
        self::assertLessThan(2.0, $debtTime['seconds']);

        $reminderTime = $this->timedRequest('/api/reminders?status=pending&page=2&limit=20');
        self::assertSame(1000, $reminderTime['payload']['pagination']['total']);
        self::assertCount(20, $reminderTime['payload']['items']);
        self::assertLessThan(2.0, $reminderTime['seconds']);
    }

    /** @return array{payload: array, seconds: float} */
    private function timedRequest(string $path): array
    {
        $start = microtime(true);
        $this->browser->request('GET', $path);
        $seconds = microtime(true) - $start;
        self::assertResponseIsSuccessful();
        return ['payload' => json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR), 'seconds' => $seconds];
    }
}
