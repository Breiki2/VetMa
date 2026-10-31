<?php

namespace App\Entity;

use App\Repository\AttentionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AttentionRepository::class)]
class Attention
{
    /** @var Collection<int, VaccineApplication> */
    #[ORM\OneToMany(mappedBy: 'attention', targetEntity: VaccineApplication::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $vaccineApplications;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class, inversedBy: 'attentions')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Patient $patient;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $dateTime;

    #[ORM\Column(type: 'json')]
    private array $types;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $reason = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $observations = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, options: ['default' => '0.00'])]
    private string $chargedAmount = '0.00';

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, options: ['default' => '0.00'])]
    private string $debtAmount = '0.00';

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(Patient $patient, \DateTimeImmutable $dateTime, array $types)
    {
        $this->patient = $patient;
        $this->dateTime = $dateTime;
        $this->types = array_values($types);
        $this->vaccineApplications = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getPatient(): Patient { return $this->patient; }
    public function getDateTime(): \DateTimeImmutable { return $this->dateTime; }
    public function getTypes(): array { return $this->types; }
    public function getReason(): ?string { return $this->reason; }
    public function getObservations(): ?string { return $this->observations; }
    public function getChargedAmount(): string { return $this->chargedAmount; }
    public function getDebtAmount(): string { return $this->debtAmount; }
    public function getVaccineApplications(): Collection { return $this->vaccineApplications; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function update(array $data): void
    {
        if (array_key_exists('dateTime', $data)) {
            $this->dateTime = $data['dateTime'];
        }
        if (array_key_exists('types', $data)) {
            $this->types = array_values($data['types']);
        }
        foreach (['reason', 'observations', 'chargedAmount', 'debtAmount'] as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];
                if (in_array($field, ['chargedAmount', 'debtAmount'], true)) {
                    $amount = trim((string) $value);
                    $this->{$field} = $amount === '' ? '0.00' : $amount;
                } else {
                    $this->{$field} = $value === null || $value === '' ? null : trim((string) $value);
                }
            }
        }

        $this->updatedAt = new \DateTimeImmutable();
    }

    public function addVaccineApplication(VaccineApplication $application): void
    {
        $application->attachTo($this);
        $this->vaccineApplications->add($application);
    }

    public function clearVaccineApplications(): void
    {
        $this->vaccineApplications->clear();
    }
}
