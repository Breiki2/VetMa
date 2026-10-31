<?php

namespace App\Tests\Controller;

use App\Entity\Attention;
use App\Entity\Client;
use App\Entity\Patient;
use App\Tests\ApiWebTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class AttentionAttachmentFlowTest extends ApiWebTestCase
{
    public function testUltrasoundAttachmentCanBeUploadedAndIsOnlyAccessibleToItsOwner(): void
    {
        $vet = $this->createUser();
        $otherVet = $this->createUser('other@example.test');
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $attention = new Attention($patient, new \DateTimeImmutable(), ['ecografia']);
        foreach ([$client, $patient, $attention] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();

        $path = tempnam(sys_get_temp_dir(), 'vetma-png-');
        file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=', true));
        $upload = new UploadedFile($path, 'estudio.png', 'image/png', null, true);
        $this->browser->request('POST', '/api/attentions/'.$attention->getId().'/attachments', files: ['files' => [$upload]], server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(201);
        $items = json_decode((string) $this->browser->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR)['items'];
        self::assertCount(1, $items);

        $this->browser->request('GET', '/api/attentions/'.$attention->getId().'/attachments/'.$items[0]['id']);
        self::assertResponseIsSuccessful();

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/csrf-token');
        $this->browser->jsonRequest('POST', '/api/login', ['email' => 'other@example.test', 'password' => 'Correct-Horse-42!'], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseIsSuccessful();
        $this->browser->request('GET', '/api/attentions/'.$attention->getId().'/attachments/'.$items[0]['id']);
        self::assertResponseStatusCodeSame(404);
    }

    public function testAttachmentsRequireAnUltrasoundAttention(): void
    {
        $vet = $this->createUser();
        $client = new Client($vet, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $attention = new Attention($patient, new \DateTimeImmutable(), ['atencion']);
        foreach ([$client, $patient, $attention] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();

        $this->browser->request('POST', '/api/attentions/'.$attention->getId().'/attachments', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        self::assertResponseStatusCodeSame(422);
    }
}
