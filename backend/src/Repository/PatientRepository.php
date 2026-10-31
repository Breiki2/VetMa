<?php

namespace App\Repository;

use App\Entity\Patient;
use App\Entity\Client;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Tools\Pagination\Paginator;

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

    /** @return array{items: list<Patient>, total: int} */
    public function pageForClient(Client $client, int $page, int $limit): array
    {
        $query = $this->createQueryBuilder('patient')->andWhere('patient.client = :client')->andWhere('patient.archived = false')
            ->setParameter('client', $client)->orderBy('patient.name', 'ASC')->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery();
        $paginator = new Paginator($query);
        return ['items' => iterator_to_array($paginator->getIterator()), 'total' => count($paginator)];
    }

    /** @return array{items: list<Patient>, total: int} */
    public function searchOwnedBy(User $owner, string $term, int $page, int $limit): array
    {
        $query = $this->createQueryBuilder('patient')->join('patient.client', 'client')
            ->andWhere('client.owner = :owner')->andWhere('client.archived = false')->andWhere('patient.archived = false')
            ->setParameter('owner', $owner)->orderBy('client.surname', 'ASC')->addOrderBy('client.name', 'ASC')->addOrderBy('patient.name', 'ASC');
        if ($term !== '') {
            $query->andWhere($query->expr()->orX('LOWER(patient.name) LIKE :term', 'LOWER(client.name) LIKE :term', 'LOWER(client.surname) LIKE :term', 'LOWER(client.phone) LIKE :term', 'LOWER(client.email) LIKE :term'))
                ->setParameter('term', '%'.mb_strtolower($term).'%');
        }
        $paginator = new Paginator($query->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery());
        return ['items' => iterator_to_array($paginator->getIterator()), 'total' => count($paginator)];
    }
}
