<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Repository\VaccineApplicationRepository;

#[ORM\Entity(repositoryClass: VaccineApplicationRepository::class)]
class VaccineApplication
{
    #[ORM\OneToOne(mappedBy: 'application', targetEntity: VaccineReminder::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private ?VaccineReminder $reminder = null;
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Attention::class, inversedBy: 'vaccineApplications')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Attention $attention;

    #[ORM\ManyToOne(targetEntity: Vaccine::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Vaccine $vaccine;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $appliedAt;

    #[ORM\Column(length: 80, nullable: true)]
    private ?string $batchNumber = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $observations = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(Vaccine $vaccine, \DateTimeImmutable $appliedAt)
    {
        $this->vaccine = $vaccine;
        $this->appliedAt = $appliedAt;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function attachTo(Attention $attention): void { $this->attention = $attention; }

    public function getId(): ?int { return $this->id; }
    public function getAttention(): Attention { return $this->attention; }
    public function getVaccine(): Vaccine { return $this->vaccine; }
    public function getAppliedAt(): \DateTimeImmutable { return $this->appliedAt; }
    public function getBatchNumber(): ?string { return $this->batchNumber; }
    public function getObservations(): ?string { return $this->observations; }
    public function getReminder(): ?VaccineReminder { return $this->reminder; }
    public function setReminder(VaccineReminder $reminder): void { $this->reminder = $reminder; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function update(array $data): void
    {
        if (array_key_exists('appliedAt', $data)) {
            $this->appliedAt = $data['appliedAt'];
        }
        if (array_key_exists('batchNumber', $data)) {
            $this->batchNumber = $data['batchNumber'] === null || $data['batchNumber'] === '' ? null : trim((string) $data['batchNumber']);
        }
        if (array_key_exists('observations', $data)) {
            $this->observations = $data['observations'] === null || $data['observations'] === '' ? null : trim((string) $data['observations']);
        }
        $this->updatedAt = new \DateTimeImmutable();
    }
}
