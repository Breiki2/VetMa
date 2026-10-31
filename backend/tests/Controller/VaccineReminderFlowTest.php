<?php

namespace App\Tests\Controller;

use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\Vaccine;
use App\Entity\VaccineReminder;
use App\Tests\ApiWebTestCase;

final class VaccineReminderFlowTest extends ApiWebTestCase
{
    public function testVaccineCreatesOneYearReminderThatOwnerCanCancel(): void
    {
        $vet = $this->createUser();
        $this->createUser('other@example.test');
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $client->update(['email' => 'ana@example.test']);
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $vaccine = new Vaccine('Triple felina', 'cat');
        foreach ([$client, $patient, $vaccine] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();

        $this->browser->jsonRequest('POST', '/api/patients/'.$patient->getId().'/attentions', [
            'dateTime' => '2026-10-30T10:00:00-03:00', 'types' => ['vacuna'],
            'vaccineApplications' => [['vaccineId' => $vaccine->getId()]],
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);

        $this->browser->request('GET', '/api/reminders?status=pending');
        $items = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR)['items'];
        self::assertCount(1, $items);
        self::assertSame('2027-10-30', $items[0]['scheduledAt']);
        self::assertSame('ana@example.test', $items[0]['clientEmail']);

        $this->browser->jsonRequest('POST', '/api/reminders/'.$items[0]['id'].'/cancel', [], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();
        self::assertSame(VaccineReminder::CANCELLED, json_decode((string) $this->browser->getResponse()->getContent(), true)['status']);

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/csrf-token');
        $this->browser->jsonRequest('POST', '/api/login', ['email' => 'other@example.test', 'password' => 'Correct-Horse-42!'], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('POST', '/api/reminders/'.$items[0]['id'].'/cancel', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(404);
    }

    public function testMissingEmailDoesNotCreateReminderAndCanBeGeneratedAfterEmailIsAdded(): void
    {
        $vet = $this->createUser();
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $vaccine = new Vaccine('Triple felina', 'cat');
        foreach ([$client, $patient, $vaccine] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/patients/'.$patient->getId().'/attentions', ['types' => ['vacuna'], 'vaccineApplications' => [['vaccineId' => $vaccine->getId()]]], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $this->browser->request('GET', '/api/reminders');
        self::assertCount(0, json_decode((string) $this->browser->getResponse()->getContent(), true)['items']);

        $managedClient = $this->entityManager->find(Client::class, $client->getId());
        $managedClient->update(['email' => 'ana@example.test']);
        $this->entityManager->flush();
        $this->browser->jsonRequest('POST', '/api/reminders/generate-missing', [], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();
        $this->browser->request('GET', '/api/reminders?status=pending');
        self::assertCount(1, json_decode((string) $this->browser->getResponse()->getContent(), true)['items']);
    }
}
