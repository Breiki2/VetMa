<?php

namespace App\Repository;

use App\Entity\Attention;
use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Tools\Pagination\Paginator;

final class AttentionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Attention::class);
    }

    public function findOwnedBy(int $id, User $owner): ?Attention
    {
        return $this->createQueryBuilder('attention')
            ->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('attention.id = :id')->andWhere('client.owner = :owner')
            ->setParameter('id', $id)->setParameter('owner', $owner)
            ->getQuery()->getOneOrNullResult();
    }

    /** @return list<Attention> */
    public function findForPatient(Patient $patient): array
    {
        return $this->findBy(['patient' => $patient], ['dateTime' => 'DESC', 'id' => 'DESC']);
    }

    public function debtForClient(Client $client): string
    {
        $amounts = $this->createQueryBuilder('attention')->select('attention.debtAmount')
            ->join('attention.patient', 'patient')->andWhere('patient.client = :client')
            ->setParameter('client', $client)->getQuery()->getSingleColumnResult();

        $cents = 0;
        foreach ($amounts as $amount) {
            if (preg_match('/^(\d+)(?:\.(\d{1,2}))?$/', (string) $amount, $matches)) {
                $cents += ((int) $matches[1] * 100) + (int) str_pad($matches[2] ?? '', 2, '0');
            }
        }

        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    /** @return list<Attention> */
    public function findForClient(Client $client): array
    {
        return $this->createQueryBuilder('attention')->join('attention.patient', 'patient')
            ->andWhere('patient.client = :client')->setParameter('client', $client)
            ->orderBy('attention.dateTime', 'DESC')->addOrderBy('attention.id', 'DESC')
            ->getQuery()->getResult();
    }

    /** @param list<Client> $clients @return array<int, string> */
    public function debtTotalsForClients(array $clients): array
    {
        if ($clients === []) return [];
        $rows = $this->getEntityManager()->createQueryBuilder()->select('client.id AS clientId, SUM(attention.debtAmount) AS debt')
            ->from(Attention::class, 'attention')->join('attention.patient', 'patient')->join('patient.client', 'client')
            ->andWhere('client IN (:clients)')->groupBy('client.id')->setParameter('clients', $clients)->getQuery()->getArrayResult();
        $totals = [];
        foreach ($rows as $row) $totals[(int) $row['clientId']] = $this->decimalString((string) $row['debt']);
        return $totals;
    }

    /** @return array{items: list<array{0: Client, debt: string}>, total: int} */
    public function clientsWithDebt(User $owner, int $page = 1, int $limit = 20): array
    {
        $query = $this->getEntityManager()->createQueryBuilder()->select('client, SUM(attention.debtAmount) AS debt')
            ->from(Client::class, 'client')->join('client.patients', 'patient')->join('patient.attentions', 'attention')
            ->andWhere('client.owner = :owner')->andWhere('client.archived = false')
            ->groupBy('client.id')->having('SUM(attention.debtAmount) > 0')->orderBy('debt', 'DESC')
            ->setParameter('owner', $owner)->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery();
        $paginator = new Paginator($query, fetchJoinCollection: false);
        return ['items' => iterator_to_array($paginator->getIterator()), 'total' => count($paginator)];
    }

    public function decimalString(string $amount): string
    {
        if (!preg_match('/^(\d+)(?:\.(\d+))?$/', $amount, $parts)) return '0.00';
        $cents = ((int) $parts[1] * 100) + (int) str_pad(substr($parts[2] ?? '', 0, 2), 2, '0');
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
