<?php

namespace App\Entity;

use App\Repository\VaccineReminderRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VaccineReminderRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_reminder_application', columns: ['application_id'])]
#[ORM\Index(name: 'idx_reminder_due', columns: ['status', 'scheduledAt'])]
class VaccineReminder
{
    public const PENDING = 'pending';
    public const SENT = 'sent';
    public const ERROR = 'error';
    public const CANCELLED = 'cancelled';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: VaccineApplication::class, inversedBy: 'reminder')]
    #[ORM\JoinColumn(name: 'application_id', nullable: false, onDelete: 'CASCADE')]
    private VaccineApplication $application;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $scheduledAt;

    #[ORM\Column(length: 20)]
    private string $status = self::PENDING;

    #[ORM\Column(options: ['default' => 0])]
    private int $attempts = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $lastAttemptAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $sentAt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $lastError = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(VaccineApplication $application, \DateTimeImmutable $scheduledAt)
    {
        $this->application = $application;
        $this->scheduledAt = $scheduledAt;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getApplication(): VaccineApplication { return $this->application; }
    public function getScheduledAt(): \DateTimeImmutable { return $this->scheduledAt; }
    public function getStatus(): string { return $this->status; }
    public function getAttempts(): int { return $this->attempts; }
    public function getLastAttemptAt(): ?\DateTimeImmutable { return $this->lastAttemptAt; }
    public function getSentAt(): ?\DateTimeImmutable { return $this->sentAt; }
    public function getLastError(): ?string { return $this->lastError; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function reschedule(\DateTimeImmutable $date): void
    {
        if ($this->status === self::PENDING) $this->scheduledAt = $date;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function reactivate(\DateTimeImmutable $date): void
    {
        if ($this->status !== self::CANCELLED) return;
        $this->status = self::PENDING;
        $this->scheduledAt = $date;
        $this->attempts = 0;
        $this->lastAttemptAt = null;
        $this->lastError = null;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function markSent(\DateTimeImmutable $at): void
    {
        $this->status = self::SENT;
        $this->sentAt = $at;
        $this->lastAttemptAt = $at;
        $this->attempts++;
        $this->lastError = null;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function markFailed(\DateTimeImmutable $at, string $error): void
    {
        $this->attempts++;
        $this->lastAttemptAt = $at;
        $this->lastError = mb_substr($error, 0, 4000);
        if ($this->attempts >= 3) $this->status = self::ERROR;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function cancel(): void
    {
        if ($this->status === self::PENDING) {
            $this->status = self::CANCELLED;
            $this->updatedAt = new \DateTimeImmutable();
        }
    }
}
