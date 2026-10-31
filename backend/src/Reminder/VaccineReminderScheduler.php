<?php

namespace App\Reminder;

use App\Entity\VaccineApplication;
use App\Entity\VaccineReminder;
use Doctrine\ORM\EntityManagerInterface;

final class VaccineReminderScheduler
{
    public function __construct(private readonly EntityManagerInterface $entities) {}

    public function synchronize(VaccineApplication $application): bool
    {
        $client = $application->getAttention()->getPatient()->getClient();
        $patient = $application->getAttention()->getPatient();
        $reminder = $application->getReminder();
        $scheduledAt = $application->getAppliedAt()->modify('+1 year');

        if ($client->getEmail() === null || $client->hasOptedOutOfReminders() || $patient->isDeceased() || $client->isArchived()) {
            $reminder?->cancel();
            return false;
        }

        if ($reminder instanceof VaccineReminder) {
            $wasCancelled = $reminder->getStatus() === VaccineReminder::CANCELLED;
            $reminder->reschedule($scheduledAt);
            $reminder->reactivate($scheduledAt);
            return $wasCancelled;
        }

        $reminder = new VaccineReminder($application, $scheduledAt);
        $application->setReminder($reminder);
        $this->entities->persist($reminder);
        return true;
    }
}
