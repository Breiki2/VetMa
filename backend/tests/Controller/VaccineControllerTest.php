<?php

namespace App\Tests\Controller;

use App\Tests\ApiWebTestCase;

final class VaccineControllerTest extends ApiWebTestCase
{
    public function testOnlyAdministratorsCanManageTheGlobalVaccineCatalog(): void
    {
        $this->createUser();
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/vaccines', [
            'name' => 'Triple felina',
            'species' => 'cat',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testVeterinariansCanSelectActiveVaccinesAndAdministratorsCanDeactivateThem(): void
    {
        $this->createUser('admin@example.test', role: 'admin');
        $this->createUser('vet@example.test');
        $this->logIn('admin@example.test');
        $this->browser->jsonRequest('POST', '/api/vaccines', [
            'name' => 'Triple felina',
            'species' => 'cat',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $vaccine = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);

        $this->browser->jsonRequest('PATCH', sprintf('/api/vaccines/%d', $vaccine['id']), [
            'active' => false,
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->jsonRequest('POST', '/api/login', [
            'email' => 'vet@example.test',
            'password' => 'Correct-Horse-42!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/vaccines');
        self::assertSame([], json_decode((string) $this->browser->getResponse()->getContent(), true));
    }
}
