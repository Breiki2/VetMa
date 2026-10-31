<?php

namespace App\Controller;

use App\Entity\User;
use App\Http\JsonInput;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class CurrentUserController extends AbstractController
{
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $user = $this->getUser();

        return $this->json([
            'id' => $user instanceof User ? $user->getId() : null,
            'email' => $user instanceof User ? $user->getEmail() : null,
            'name' => $user instanceof User ? $user->getName() : null,
            'role' => $user instanceof User ? $user->getRole() : null,
        ]);
    }

    #[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
    public function updateProfile(Request $request, JsonInput $input, EntityManagerInterface $entities): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'unauthenticated'], 401);
        }

        $data = $input->read($request);
        $name = isset($data['name']) ? trim((string) $data['name']) : $user->getName();
        $email = isset($data['email']) ? mb_strtolower(trim((string) $data['email'])) : $user->getEmail();
        $errors = [];

        if ($name === '') {
            $errors['name'] = 'El nombre es obligatorio.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Ingresá un email válido.';
        }
        $existing = $entities->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existing instanceof User && $existing->getId() !== $user->getId()) {
            $errors['email'] = 'Ese email ya está en uso.';
        }
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $user->changeName($name);
        $user->changeEmail($email);
        $entities->flush();

        return $this->json($this->userData($user));
    }

    #[Route('/api/me/password', name: 'api_me_password', methods: ['PATCH'])]
    public function changePassword(
        Request $request,
        JsonInput $input,
        EntityManagerInterface $entities,
        UserPasswordHasherInterface $hasher,
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'unauthenticated'], 401);
        }

        $data = $input->read($request);
        $current = (string) ($data['currentPassword'] ?? '');
        $new = (string) ($data['newPassword'] ?? '');
        if (!$hasher->isPasswordValid($user, $current)) {
            return $this->json(['error' => 'current_password_invalid'], 422);
        }
        if (mb_strlen($new) < 12) {
            return $this->json(['error' => 'validation_failed', 'details' => ['newPassword' => 'Usá al menos 12 caracteres.']], 422);
        }

        $user->setPassword($hasher->hashPassword($user, $new));
        $entities->flush();

        return $this->json(['ok' => true]);
    }

    private function userData(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'role' => $user->getRole(),
        ];
    }
}
