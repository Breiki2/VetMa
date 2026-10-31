<?php

namespace App\Entity;

use App\Repository\ClientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ClientRepository::class)]
#[ORM\Index(name: 'idx_client_owner_name', columns: ['owner_id', 'surname', 'name'])]
#[ORM\Index(name: 'idx_client_owner_phone', columns: ['owner_id', 'phone'])]
#[ORM\Index(name: 'idx_client_owner_email', columns: ['owner_id', 'email'])]
class Client
{
    /** @var Collection<int, Patient> */
    #[ORM\OneToMany(mappedBy: 'client', targetEntity: Patient::class, cascade: ['persist'])]
    private Collection $patients;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private User $owner;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(length: 120)]
    private string $surname;

    #[ORM\Column(length: 40)]
    private string $phone;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(options: ['default' => false])]
    private bool $archived = false;

    #[ORM\Column(options: ['default' => false])]
    private bool $remindersOptOut = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(User $owner, string $name, string $surname, string $phone)
    {
        $this->owner = $owner;
        $this->name = trim($name);
        $this->surname = trim($surname);
        $this->phone = trim($phone);
        $this->patients = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getOwner(): User { return $this->owner; }
    public function getName(): string { return $this->name; }
    public function getSurname(): string { return $this->surname; }
    public function getPhone(): string { return $this->phone; }
    public function getEmail(): ?string { return $this->email; }
    public function getAddress(): ?string { return $this->address; }
    public function getNotes(): ?string { return $this->notes; }
    public function isArchived(): bool { return $this->archived; }
    public function hasOptedOutOfReminders(): bool { return $this->remindersOptOut; }
    public function getPatients(): Collection { return $this->patients; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function update(array $data): void
    {
        if (array_key_exists('remindersOptOut', $data) && is_bool($data['remindersOptOut'])) {
            $this->remindersOptOut = $data['remindersOptOut'];
        }
        foreach (['name', 'surname', 'phone', 'email', 'address', 'notes'] as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            $value = $data[$field];
            $value = $value === null || $value === '' ? null : trim((string) $value);
            if (in_array($field, ['name', 'surname', 'phone'], true)) {
                $this->{$field} = $value ?? '';
            } else {
                $this->{$field} = $value;
            }
        }

        $this->touch();
    }

    public function archive(): void
    {
        $this->archived = true;
        $this->touch();
    }

    public function setRemindersOptOut(bool $optOut): void
    {
        $this->remindersOptOut = $optOut;
        $this->touch();
    }

    private function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
