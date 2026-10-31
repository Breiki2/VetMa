<?php

namespace App\Tests\Controller;

use App\Tests\ApiWebTestCase;

final class LoginFlowTest extends ApiWebTestCase
{
    public function testVeterinarianCanLogInAndReadTheirOwnProfile(): void
    {
        $this->createUser();
        $this->logIn();

        self::assertResponseIsSuccessful();
        self::assertSame('vet@example.test', json_decode((string) $this->browser->getResponse()->getContent(), true)['email']);

        $this->browser->request('GET', '/api/me');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'id' => 1,
            'email' => 'vet@example.test',
            'name' => 'Dra. Vet',
            'role' => 'veterinarian',
        ], json_decode((string) $this->browser->getResponse()->getContent(), true));
    }

    public function testInvalidCredentialsDoNotCreateAnAuthenticatedSession(): void
    {
        $this->createUser();
        $this->browser->jsonRequest('POST', '/api/login', [
            'email' => 'vet@example.test',
            'password' => 'wrong-password',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['error' => 'invalid_credentials'], json_decode((string) $this->browser->getResponse()->getContent(), true));

        $this->browser->request('GET', '/api/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testLoginRequiresASessionBoundCsrfToken(): void
    {
        $this->createUser();
        $this->browser->jsonRequest('POST', '/api/login', [
            'email' => 'vet@example.test',
            'password' => 'Correct-Horse-42!',
        ]);

        self::assertResponseStatusCodeSame(419);
        self::assertSame(['error' => 'csrf_token_invalid'], json_decode((string) $this->browser->getResponse()->getContent(), true));
    }

    public function testDeactivatedVeterinarianCannotLogIn(): void
    {
        $this->createUser(active: false);
        $this->logIn();

        self::assertResponseStatusCodeSame(401);
    }
}
