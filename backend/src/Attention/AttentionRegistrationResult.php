<?php

namespace App\Attention;

use App\Entity\Attention;

final readonly class AttentionRegistrationResult
{
    /** @param array<string, string> $errors */
    private function __construct(
        private ?Attention $attention,
        private array $errors,
    ) {
    }

    public static function success(Attention $attention): self
    {
        return new self($attention, []);
    }

    /** @param array<string, string> $errors */
    public static function failure(array $errors): self
    {
        return new self(null, $errors);
    }

    public function isSuccessful(): bool
    {
        return $this->attention !== null;
    }

    public function attention(): Attention
    {
        if ($this->attention === null) {
            throw new \LogicException('A failed registration has no attention.');
        }

        return $this->attention;
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }
}
