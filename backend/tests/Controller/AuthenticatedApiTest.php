<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AuthenticatedApiTest extends WebTestCase
{
    public function testUnauthenticatedRequestsCannotReadTheCurrentUser(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
        self::assertStringContainsString('application/json', (string) $client->getResponse()->headers->get('content-type'));
        self::assertSame(
            ['error' => 'unauthenticated'],
            json_decode((string) $client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR),
        );
    }
}
