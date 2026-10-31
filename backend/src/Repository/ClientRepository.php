<?php

namespace App\Repository;

use App\Entity\Client;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Doctrine\Persistence\ManagerRegistry;

final class ClientRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Client::class);
    }

    /** @return array{items: list<Client>, total: int} */
    public function searchOwnedBy(User $owner, string $term, bool $includeArchived, int $page, int $limit): array
    {
        $query = $this->createQueryBuilder('client')
            ->andWhere('client.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('client.surname', 'ASC')
            ->addOrderBy('client.name', 'ASC');

        if (!$includeArchived) {
            $query->andWhere('client.archived = false');
        }
        if ($term !== '') {
            $query->andWhere('LOWER(client.name) LIKE :term OR LOWER(client.surname) LIKE :term OR LOWER(client.phone) LIKE :term OR LOWER(client.email) LIKE :term')
                ->setParameter('term', '%'.mb_strtolower($term).'%');
        }

        $query->setFirstResult(($page - 1) * $limit)->setMaxResults($limit);
        $paginator = new Paginator($query->getQuery());

        return ['items' => iterator_to_array($paginator->getIterator()), 'total' => count($paginator)];
    }

    public function findOwnedBy(int $id, User $owner, bool $includeArchived = false): ?Client
    {
        $query = $this->createQueryBuilder('client')
            ->andWhere('client.id = :id')
            ->andWhere('client.owner = :owner')
            ->setParameter('id', $id)
            ->setParameter('owner', $owner);

        if (!$includeArchived) {
            $query->andWhere('client.archived = false');
        }

        return $query->getQuery()->getOneOrNullResult();
    }
}
