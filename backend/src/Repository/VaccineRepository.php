<?php

namespace App\Repository;

use App\Entity\Vaccine;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class VaccineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Vaccine::class);
    }

    /** @return list<Vaccine> */
    public function availableFor(string $species, bool $includeInactive = false): array
    {
        $query = $this->createQueryBuilder('vaccine')
            ->andWhere('vaccine.species = :species OR vaccine.species = :both')
            ->setParameter('species', $species)
            ->setParameter('both', 'both')
            ->orderBy('vaccine.name', 'ASC');

        if (!$includeInactive) {
            $query->andWhere('vaccine.active = true');
        }

        return $query->getQuery()->getResult();
    }
}
