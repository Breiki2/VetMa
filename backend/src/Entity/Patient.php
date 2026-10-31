<?php

namespace App\Entity;

use App\Repository\PatientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PatientRepository::class)]
#[ORM\Index(name: 'idx_patient_client_name', columns: ['client_id', 'name'])]
#[ORM\Index(name: 'idx_patient_name_client', columns: ['name', 'client_id'])]
class Patient
{
    /** @var Collection<int, Attention> */
    #[ORM\OneToMany(mappedBy: 'patient', targetEntity: Attention::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $attentions;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Client::class, inversedBy: 'patients')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Client $client;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(length: 10)]
    private string $species;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $breed = null;

    #[ORM\Column(length: 10)]
    private string $sex;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $birthDate = null;

    #[ORM\Column(length: 80, nullable: true)]
    private ?string $approximateAge = null;

    #[ORM\Column]
    private bool $castrated;

    #[ORM\Column(options: ['default' => false])]
    private bool $archived = false;

    #[ORM\Column(options: ['default' => false])]
    private bool $deceased = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(Client $client, string $name, string $species, string $sex, bool $castrated)
    {
        $this->client = $client;
        $this->name = trim($name);
        $this->species = $species;
        $this->sex = $sex;
        $this->castrated = $castrated;
        $this->attentions = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getClient(): Client { return $this->client; }
    public function getOwner(): User { return $this->client->getOwner(); }
    public function getName(): string { return $this->name; }
    public function getSpecies(): string { return $this->species; }
    public function getBreed(): ?string { return $this->breed; }
    public function getSex(): string { return $this->sex; }
    public function getBirthDate(): ?\DateTimeImmutable { return $this->birthDate; }
    public function getApproximateAge(): ?string { return $this->approximateAge; }
    public function isCastrated(): bool { return $this->castrated; }
    public function isArchived(): bool { return $this->archived; }
    public function isDeceased(): bool { return $this->deceased; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function getAttentions(): Collection { return $this->attentions; }

    public function update(array $data): void
    {
        foreach (['name', 'species', 'breed', 'sex', 'approximateAge'] as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];
                $this->{$field} = $value === null || $value === '' ? null : trim((string) $value);
            }
        }
        if (array_key_exists('birthDate', $data)) {
            $this->birthDate = $data['birthDate'];
        }
        if (array_key_exists('castrated', $data)) {
            $this->castrated = $data['castrated'];
        }
        if (array_key_exists('deceased', $data)) {
            $this->deceased = $data['deceased'];
        }

        $this->updatedAt = new \DateTimeImmutable();
    }

    public function archive(): void
    {
        $this->archived = true;
        $this->updatedAt = new \DateTimeImmutable();
    }
}
