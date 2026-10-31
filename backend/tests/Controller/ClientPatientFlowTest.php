<?php

namespace App\Tests\Controller;

use App\Tests\ApiWebTestCase;

final class ClientPatientFlowTest extends ApiWebTestCase
{
    public function testVeterinarianCanCreateAClientAndPatientAndSeeTheirHistory(): void
    {
        $this->createUser();
        $this->logIn();

        $this->browser->jsonRequest('POST', '/api/clients', [
            'name' => 'María',
            'surname' => 'Gómez',
            'phone' => '1122334455',
            'email' => 'maria@example.test',
            'address' => 'Calle 123',
            'notes' => 'Prefiere contacto por la tarde',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $client = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        $clientId = $client['id'];
        self::assertSame('Gómez', $client['surname']);

        $this->browser->jsonRequest('POST', sprintf('/api/clients/%d/patients', $clientId), [
            'name' => 'Luna',
            'species' => 'cat',
            'breed' => 'mestiza',
            'sex' => 'female',
            'birthDate' => '2022-03-15',
            'castrated' => true,
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $patient = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);

        $this->browser->request('GET', sprintf('/api/clients/%d', $clientId));
        self::assertResponseIsSuccessful();
        $detail = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('María', $detail['name']);
        self::assertSame('0.00', $detail['debtTotal']);
        self::assertCount(1, $detail['patients']);
        self::assertSame($patient['id'], $detail['patients'][0]['id']);
    }

    public function testAnotherVeterinarianCannotReadOrCreateRecordsForAnOwnedClient(): void
    {
        $this->createUser();
        $this->createUser('another@example.test');
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/clients', [
            'name' => 'Juan',
            'surname' => 'Pérez',
            'phone' => '1199887766',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $clientId = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR)['id'];

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/csrf-token');
        $this->browser->jsonRequest('POST', '/api/login', [
            'email' => 'another@example.test',
            'password' => 'Correct-Horse-42!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();

        $this->browser->request('GET', sprintf('/api/clients/%d', $clientId));
        self::assertResponseStatusCodeSame(404);

        $this->browser->jsonRequest('POST', sprintf('/api/clients/%d/patients', $clientId), [
            'name' => 'Luna',
            'species' => 'cat',
            'sex' => 'female',
            'approximateAge' => '3 años',
            'castrated' => true,
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(404);
    }

    public function testClientRequiresNameSurnameAndPhone(): void
    {
        $this->createUser();
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/clients', ['name' => 'Ana'], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('validation_failed', json_decode((string) $this->browser->getResponse()->getContent(), true)['error']);
    }
}
