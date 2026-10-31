<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\VaccineReminder;
use App\Reminder\VaccineReminderScheduler;
use App\Repository\VaccineApplicationRepository;
use App\Repository\VaccineReminderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class VaccineReminderController extends AbstractController
{
    #[Route('/api/reminders', methods: ['GET'])]
    public function index(Request $request, VaccineReminderRepository $reminders): JsonResponse
    {
        $owner = $this->getUser();
        if (!$owner instanceof User) return $this->json(['error' => 'unauthenticated'], 401);
        $status = $request->query->get('status');
        if ($status !== null && !in_array($status, [VaccineReminder::PENDING, VaccineReminder::SENT, VaccineReminder::ERROR, VaccineReminder::CANCELLED], true)) return $this->json(['error' => 'invalid_status'], 422);
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 20)));
        $result = $reminders->findForOwner($owner, $status, $page, $limit);
        return $this->json(['items' => array_map($this->data(...), $result['items']), 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $result['total']]]);
    }

    #[Route('/api/reminders/generate-missing', methods: ['POST'])]
    public function generateMissing(VaccineApplicationRepository $applications, VaccineReminderScheduler $scheduler, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        if (!$owner instanceof User) return $this->json(['error' => 'unauthenticated'], 401);
        $createdOrRestored = 0;
        foreach ($applications->findForOwner($owner) as $application) {
            if ($scheduler->synchronize($application)) $createdOrRestored++;
        }
        $entities->flush();
        return $this->json(['generated' => $createdOrRestored]);
    }

    #[Route('/api/reminders/{id<\d+>}/cancel', methods: ['POST'])]
    public function cancel(int $id, VaccineReminderRepository $reminders, EntityManagerInterface $entities): JsonResponse
    {
        $owner = $this->getUser();
        $reminder = $owner instanceof User ? $reminders->findOwnedBy($id, $owner) : null;
        if (!$reminder instanceof VaccineReminder) return $this->json(['error' => 'not_found'], 404);
        if ($reminder->getStatus() !== VaccineReminder::PENDING) return $this->json(['error' => 'reminder_not_pending'], 422);
        $reminder->cancel();
        $entities->flush();
        return $this->json($this->data($reminder));
    }

    private function data(VaccineReminder $reminder): array
    {
        $application = $reminder->getApplication();
        $patient = $application->getAttention()->getPatient();
        $client = $patient->getClient();
        $owner = $client->getOwner();
        return ['id' => $reminder->getId(), 'scheduledAt' => $reminder->getScheduledAt()->format('Y-m-d'), 'status' => $reminder->getStatus(), 'attempts' => $reminder->getAttempts(), 'lastError' => $reminder->getLastError(), 'sentAt' => $reminder->getSentAt()?->format(DATE_ATOM), 'clientName' => $client->getName().' '.$client->getSurname(), 'patientName' => $patient->getName(), 'vaccineName' => $application->getVaccine()->getName(), 'appliedAt' => $application->getAppliedAt()->format('Y-m-d'), 'clientEmail' => $client->getEmail(), 'veterinarianName' => $owner->getName(), 'veterinarianEmail' => $owner->getEmail()];
    }
}
