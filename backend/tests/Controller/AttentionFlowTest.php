<?php

namespace App\Tests\Controller;

use App\Entity\Client;
use App\Entity\Attention;
use App\Entity\Patient;
use App\Entity\Vaccine;
use App\Tests\ApiWebTestCase;

final class AttentionFlowTest extends ApiWebTestCase
{
    public function testVeterinarianRecordsManualAmountsAndVaccineAndClientDebtIsSummed(): void
    {
        $vet = $this->createUser();
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $patient->update(['approximateAge' => '4 años']);
        $vaccine = new Vaccine('Triple felina', 'cat');
        foreach ([$client, $patient, $vaccine] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();

        $this->browser->jsonRequest('POST', '/api/patients/'.$patient->getId().'/attentions', [
            'dateTime' => '2026-10-30T10:00:00-03:00', 'types' => ['vacuna', 'atencion'], 'reason' => 'Control',
            'chargedAmount' => '15000.00', 'debtAmount' => '5000.00',
            'vaccineApplications' => [['vaccineId' => $vaccine->getId(), 'batchNumber' => 'L-123']],
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $record = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('15000.00', $record['chargedAmount']);
        self::assertSame('5000.00', $record['debtAmount']);
        self::assertSame('L-123', $record['vaccineApplications'][0]['batchNumber']);

        $this->browser->request('GET', '/api/clients/'.$client->getId());
        $clientDetail = json_decode((string) $this->browser->getResponse()->getContent(), true);
        self::assertSame('5000.00', $clientDetail['debtTotal']);
        self::assertCount(1, $clientDetail['attentions']);
        $this->browser->request('GET', '/api/patients/'.$patient->getId());
        self::assertSame('Triple felina', json_decode((string) $this->browser->getResponse()->getContent(), true)['vaccines'][0]['name']);
        $this->browser->request('GET', '/api/clients/debts');
        $debts = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertCount(1, $debts['items']);
        self::assertSame(1, $debts['pagination']['total']);
    }

    public function testVaccineAttentionRequiresValidApplicableVaccineAndRejectsNegativeAmounts(): void
    {
        $vet = $this->createUser();
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $dogVaccine = new Vaccine('Antirrábica canina', 'dog');
        foreach ([$client, $patient, $dogVaccine] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/patients/'.$patient->getId().'/attentions', [
            'types' => ['vacuna'], 'chargedAmount' => '-1', 'vaccineApplications' => [['vaccineId' => $dogVaccine->getId()]],
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(422);

        $managedPatient = $this->entityManager->find(Patient::class, $patient->getId());
        $attention = new Attention($managedPatient, new \DateTimeImmutable(), ['atencion']);
        $this->entityManager->persist($attention);
        $this->entityManager->flush();
        $this->browser->jsonRequest('PATCH', '/api/attentions/'.$attention->getId(), ['types' => ['vacuna']], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(422);
    }
}
