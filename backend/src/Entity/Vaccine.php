<?php

namespace App\Entity;

use App\Repository\VaccineRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VaccineRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_vaccine_name', columns: ['name'])]
class Vaccine
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(length: 10)]
    private string $species;

    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(string $name, string $species)
    {
        $this->name = trim($name);
        $this->species = $species;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSpecies(): string { return $this->species; }
    public function isActive(): bool { return $this->active; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function update(array $data): void
    {
        if (array_key_exists('name', $data)) {
            $this->name = trim((string) $data['name']);
        }
        if (array_key_exists('species', $data)) {
            $this->species = (string) $data['species'];
        }
        if (array_key_exists('active', $data)) {
            $this->active = $data['active'];
        }
        $this->updatedAt = new \DateTimeImmutable();
    }
}
