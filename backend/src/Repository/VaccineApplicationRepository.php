<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\VaccineApplication;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class VaccineApplicationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry) { parent::__construct($registry, VaccineApplication::class); }

    /** @return list<VaccineApplication> */
    public function findForOwner(User $owner): array
    {
        return $this->createQueryBuilder('application')->join('application.attention', 'attention')->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('client.owner = :owner')->setParameter('owner', $owner)->getQuery()->getResult();
    }
}
