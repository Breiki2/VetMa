<?php

namespace App\Tests;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiWebTestCase extends WebTestCase
{
    protected \Symfony\Bundle\FrameworkBundle\KernelBrowser $browser;
    protected EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        $this->browser = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $metadata = $this->entityManager->getMetadataFactory()->getAllMetadata();
        $schema = new SchemaTool($this->entityManager);
        $schema->dropSchema($metadata);
        $schema->createSchema($metadata);
    }

    protected function createUser(string $email = 'vet@example.test', string $role = 'veterinarian', bool $active = true): User
    {
        $user = new User($email, 'Dra. Vet', $role);
        $user->setActive($active);
        $user->setPassword(password_hash('Correct-Horse-42!', PASSWORD_DEFAULT));
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    protected function csrfToken(): string
    {
        $this->browser->request('GET', '/api/csrf-token');
        $data = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);

        return $data['csrfToken'];
    }

    protected function logIn(string $email = 'vet@example.test'): void
    {
        $this->browser->jsonRequest('POST', '/api/login', [
            'email' => $email,
            'password' => 'Correct-Horse-42!',
        ], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
    }
}
