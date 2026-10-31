<?php

namespace App\Controller;

use App\Attention\AttentionRegistration;
use App\Entity\Attention;
use App\Entity\Patient;
use App\Entity\User;
use App\Entity\VaccineApplication;
use App\Http\JsonInput;
use App\Repository\AttentionRepository;
use App\Repository\PatientRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class AttentionController extends AbstractController
{
    public function __construct(private readonly string $attachmentDirectory)
    {
    }

    #[Route('/api/patients/{patientId<\\d+>}/attentions', methods: ['GET'])]
    public function list(int $patientId, PatientRepository $patients, AttentionRepository $attentions): JsonResponse
    {
        $owner = $this->getUser();
        $patient = $owner instanceof User ? $patients->findOwnedBy($patientId, $owner) : null;
        if (!$patient instanceof Patient) return $this->json(['error' => 'not_found'], 404);

        return $this->json(array_map($this->data(...), $attentions->findForPatient($patient)));
    }

    #[Route('/api/patients/{patientId<\\d+>}/attentions', methods: ['POST'])]
    public function create(int $patientId, Request $request, JsonInput $input, PatientRepository $patients, AttentionRegistration $registration): JsonResponse
    {
        $owner = $this->getUser();
        $patient = $owner instanceof User ? $patients->findOwnedBy($patientId, $owner) : null;
        if (!$patient instanceof Patient) return $this->json(['error' => 'not_found'], 404);
        $result = $registration->create($patient, $input->read($request));
        if (!$result->isSuccessful()) return $this->json(['error' => 'validation_failed', 'details' => $result->errors()], 422);

        return $this->json($this->data($result->attention()), 201);
    }

    #[Route('/api/attentions/{id<\\d+>}', methods: ['PATCH'])]
    public function update(int $id, Request $request, JsonInput $input, AttentionRepository $attentions, AttentionRegistration $registration): JsonResponse
    {
        $owner = $this->getUser();
        $attention = $owner instanceof User ? $attentions->findOwnedBy($id, $owner) : null;
        if (!$attention instanceof Attention) return $this->json(['error' => 'not_found'], 404);
        $result = $registration->update($attention, $input->read($request));
        if (!$result->isSuccessful()) return $this->json(['error' => 'validation_failed', 'details' => $result->errors()], 422);

        return $this->json($this->data($result->attention()));
    }

    #[Route('/api/attentions/{id<\\d+>}', methods: ['DELETE'])]
    public function delete(int $id, AttentionRepository $attentions, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        $attention = $owner instanceof User ? $attentions->findOwnedBy($id, $owner) : null;
        if (!$attention instanceof Attention) return $this->json(['error' => 'not_found'], 404);
        foreach ($attention->getAttachments() as $attachment) {
            $path = $this->attachmentDirectory.'/'.$attachment->getStoredName();
            if (is_file($path)) unlink($path);
        }
        $entities->remove($attention); $entities->flush();
        return $this->json(null, 204);
    }

    private function data(Attention $attention): array
    {
        return ['id' => $attention->getId(), 'patientId' => $attention->getPatient()->getId(), 'dateTime' => $attention->getDateTime()->format(DATE_ATOM), 'types' => $attention->getTypes(), 'reason' => $attention->getReason(), 'observations' => $attention->getObservations(), 'ultrasoundReport' => $attention->getUltrasoundReport(), 'attachments' => array_map(static fn ($file) => ['id' => $file->getId(), 'name' => $file->getOriginalName(), 'mimeType' => $file->getMimeType(), 'size' => $file->getSize()], $attention->getAttachments()->toArray()), 'chargedAmount' => $attention->getChargedAmount(), 'debtAmount' => $attention->getDebtAmount(), 'vaccineApplications' => array_map(static fn (VaccineApplication $a) => ['id' => $a->getId(), 'vaccineId' => $a->getVaccine()->getId(), 'vaccineName' => $a->getVaccine()->getName(), 'appliedAt' => $a->getAppliedAt()->format(DATE_ATOM), 'batchNumber' => $a->getBatchNumber(), 'observations' => $a->getObservations()], $attention->getVaccineApplications()->toArray())];
    }
}
