<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'app_user')]
#[ORM\UniqueConstraint(name: 'uniq_app_user_email', columns: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private string $email;

    #[ORM\Column(length: 255)]
    private string $password = '';

    #[ORM\Column(length: 180)]
    private string $name;

    #[ORM\Column(length: 20)]
    private string $role = 'veterinarian';

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(string $email, string $name, string $role = 'veterinarian')
    {
        $this->email = mb_strtolower(trim($email));
        $this->name = trim($name);
        $this->role = $role;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function changeEmail(string $email): void
    {
        $this->email = mb_strtolower(trim($email));
        $this->touch();
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function changeName(string $name): void
    {
        $this->name = trim($name);
        $this->touch();
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function changeRole(string $role): void
    {
        if (!in_array($role, ['admin', 'veterinarian'], true)) {
            throw new \InvalidArgumentException('Role must be admin or veterinarian.');
        }

        $this->role = $role;
        $this->touch();
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): void
    {
        $this->active = $active;
        $this->touch();
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getRoles(): array
    {
        return [$this->role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_VETERINARIAN'];
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
        $this->touch();
    }

    public function eraseCredentials(): void
    {
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    private function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
