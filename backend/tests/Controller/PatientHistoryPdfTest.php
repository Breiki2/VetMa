<?php

namespace App\Tests\Controller;

use App\Entity\Attention;
use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\Vaccine;
use App\Entity\VaccineApplication;
use App\Tests\ApiWebTestCase;

final class PatientHistoryPdfTest extends ApiWebTestCase
{
    public function testOwnerCanExportClinicalSummaryAndAnotherVeterinarianCannot(): void
    {
        $owner = $this->createUser();
        $this->createUser('other@example.test');
        $client = new Client($owner, 'Ana', 'Pérez', '112233');
        $patient = new Patient($client, 'Mora', 'cat', 'female', true);
        $patient->update(['approximateAge' => '4 años']);
        $vaccine = new Vaccine('Triple felina', 'cat');
        $attention = new Attention($patient, new \DateTimeImmutable('2026-10-30T10:00:00-03:00'), ['vacuna', 'ecografia']);
        $attention->update(['reason' => 'Control anual', 'ultrasoundReport' => 'Sin hallazgos relevantes.', 'chargedAmount' => '12000.00']);
        $application = new VaccineApplication($vaccine, new \DateTimeImmutable('2026-10-30T10:00:00-03:00'));
        $attention->addVaccineApplication($application);
        foreach ([$client, $patient, $vaccine, $attention] as $entity) $this->entityManager->persist($entity);
        $this->entityManager->flush();
        $this->logIn();

        $this->browser->request('GET', '/api/patients/'.$patient->getId().'/history.pdf');
        self::assertResponseIsSuccessful();
        self::assertSame('application/pdf', $this->browser->getResponse()->headers->get('Content-Type'));
        $content = (string) $this->browser->getResponse()->getContent();
        self::assertStringStartsWith('%PDF-1.4', $content);
        self::assertStringContainsString('Mora', $content);
        self::assertStringContainsString('Triple felina', $content);
        self::assertStringContainsString('Sin hallazgos', $content);

        $this->browser->request('POST', '/api/logout', server: ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/csrf-token');
        $this->browser->jsonRequest('POST', '/api/login', ['email' => 'other@example.test', 'password' => 'Correct-Horse-42!'], ['HTTP_X_CSRF_TOKEN' => $this->csrfToken()]);
        $this->browser->request('GET', '/api/patients/'.$patient->getId().'/history.pdf');
        self::assertResponseStatusCodeSame(404);
    }
}
