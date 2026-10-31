<?php

namespace App\Tests\Controller;

use App\Tests\ApiWebTestCase;
use App\Entity\User;

final class AdminUserControllerTest extends ApiWebTestCase
{
    public function testVeterinarianCannotManageAccounts(): void
    {
        $this->createUser();
        $this->logIn();
        $this->browser->request('GET', '/api/admin/users');

        self::assertResponseStatusCodeSame(403);
    }

    public function testAdministratorCanCreateAVeterinarianWithoutExposingItsPassword(): void
    {
        $this->createUser(role: 'admin');
        $this->logIn();
        $this->browser->jsonRequest('POST', '/api/admin/users', [
            'email' => 'other@example.test',
            'name' => 'Dra. Otra',
            'role' => 'veterinarian',
            'password' => 'Initial-Pass-987!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseStatusCodeSame(201);
        $created = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('other@example.test', $created['email']);
        self::assertSame('veterinarian', $created['role']);
        self::assertArrayNotHasKey('password', $created);

        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'other@example.test']);
        self::assertNotNull($user);
        self::assertNotSame('Initial-Pass-987!', $user->getPassword());
    }

    public function testAdminCanUpdateTheirContactProfileAndChangePassword(): void
    {
        $admin = $this->createUser(role: 'admin');
        $adminId = $admin->getId();
        $this->logIn();
        $this->browser->jsonRequest('PATCH', '/api/me', [
            'name' => 'Dra. Veterinaria',
            'email' => 'admin-new@example.test',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseIsSuccessful();
        self::assertSame('admin-new@example.test', json_decode((string) $this->browser->getResponse()->getContent(), true)['email']);

        $this->browser->jsonRequest('PATCH', '/api/me/password', [
            'currentPassword' => 'Correct-Horse-42!',
            'newPassword' => 'New-Password-985!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseIsSuccessful();
        $reloaded = static::getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class)
            ->getRepository(User::class)
            ->find($adminId);
        self::assertNotSame('Correct-Horse-42!', $reloaded->getPassword());
    }

    public function testAdminCanEditAndResetAnotherAccountPassword(): void
    {
        $this->createUser(role: 'admin');
        $this->createUser('old@example.test');
        $this->logIn();
        $target = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'old@example.test']);

        $this->browser->jsonRequest('PATCH', '/api/admin/users/'.$target->getId(), [
            'name' => 'Dra. Nueva',
            'email' => 'new@example.test',
            'password' => 'Reset-Password-987!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);

        self::assertResponseIsSuccessful();
        $updated = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('Dra. Nueva', $updated['name']);
        self::assertSame('new@example.test', $updated['email']);
        self::assertArrayNotHasKey('password', $updated);

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/csrf-token');
        $this->browser->jsonRequest('POST', '/api/login', ['email' => 'new@example.test', 'password' => 'Reset-Password-987!'], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();
    }
}
