<?php

namespace App\Repository;

use App\Entity\Patient;
use App\Entity\Client;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class PatientRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Patient::class);
    }

    public function findOwnedBy(int $id, User $owner, bool $includeArchived = false): ?Patient
    {
        $query = $this->createQueryBuilder('patient')
            ->join('patient.client', 'client')
            ->andWhere('patient.id = :id')
            ->andWhere('client.owner = :owner')
            ->setParameter('id', $id)
            ->setParameter('owner', $owner);

        if (!$includeArchived) {
            $query->andWhere('patient.archived = false');
        }

        return $query->getQuery()->getOneOrNullResult();
    }

    /** @return list<Patient> */
    public function findForClient(Client $client, bool $includeArchived = false): array
    {
        $query = $this->createQueryBuilder('patient')
            ->andWhere('patient.client = :client')
            ->setParameter('client', $client)
            ->orderBy('patient.name', 'ASC');

        if (!$includeArchived) {
            $query->andWhere('patient.archived = false');
        }

        return $query->getQuery()->getResult();
    }
}
