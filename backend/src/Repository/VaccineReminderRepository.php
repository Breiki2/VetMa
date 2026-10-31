<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\VaccineReminder;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class VaccineReminderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry) { parent::__construct($registry, VaccineReminder::class); }

    /** @return list<VaccineReminder> */
    public function findDue(\DateTimeImmutable $today): array
    {
        return $this->createQueryBuilder('reminder')->join('reminder.application', 'application')->join('application.attention', 'attention')->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('reminder.status = :status')->andWhere('reminder.scheduledAt <= :today')->andWhere('(reminder.lastAttemptAt IS NULL OR reminder.lastAttemptAt < :today)')->andWhere('client.email IS NOT NULL')->andWhere('client.remindersOptOut = false')->andWhere('patient.deceased = false')
            ->setParameter('status', VaccineReminder::PENDING)->setParameter('today', $today->format('Y-m-d'))
            ->orderBy('reminder.scheduledAt', 'ASC')->setMaxResults(500)->getQuery()->getResult();
    }

    /** @return list<VaccineReminder> */
    public function findForOwner(User $owner, ?string $status = null): array
    {
        $query = $this->createQueryBuilder('reminder')->join('reminder.application', 'application')->join('application.attention', 'attention')->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('client.owner = :owner')->setParameter('owner', $owner);
        if ($status !== null) $query->andWhere('reminder.status = :status')->setParameter('status', $status);
        return $query->orderBy('reminder.scheduledAt', 'ASC')->setMaxResults(200)->getQuery()->getResult();
    }

    public function findOwnedBy(int $id, User $owner): ?VaccineReminder
    {
        return $this->createQueryBuilder('reminder')->join('reminder.application', 'application')->join('application.attention', 'attention')->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('reminder.id = :id')->andWhere('client.owner = :owner')->setParameter('id', $id)->setParameter('owner', $owner)->getQuery()->getOneOrNullResult();
    }

    /** @return list<VaccineReminder> */
    public function findForClient(Client $client): array
    {
        return $this->createQueryBuilder('reminder')->join('reminder.application', 'application')->join('application.attention', 'attention')->join('attention.patient', 'patient')
            ->andWhere('patient.client = :client')->setParameter('client', $client)->getQuery()->getResult();
    }

    /** @return list<VaccineReminder> */
    public function findForPatient(Patient $patient): array
    {
        return $this->createQueryBuilder('reminder')->join('reminder.application', 'application')->join('application.attention', 'attention')
            ->andWhere('attention.patient = :patient')->setParameter('patient', $patient)->getQuery()->getResult();
    }
}
