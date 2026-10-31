<?php

namespace App\Controller;

use App\Entity\User;
use App\Http\JsonInput;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/users')]
final class AdminUserController extends AbstractController
{
    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(UserRepository $users): JsonResponse
    {
        return $this->json(array_map($this->userData(...), $users->findBy([], ['name' => 'ASC'])));
    }

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(
        Request $request,
        JsonInput $input,
        UserRepository $users,
        EntityManagerInterface $entities,
        UserPasswordHasherInterface $hasher,
    ): JsonResponse {
        $data = $input->read($request);
        $errors = $this->validate($data, creating: true);
        $email = mb_strtolower(trim((string) ($data['email'] ?? '')));
        if ($users->findOneBy(['email' => $email]) instanceof User) {
            $errors['email'] = 'Ese email ya está en uso.';
        }
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $user = new User($email, (string) $data['name'], (string) $data['role']);
        $user->setPassword($hasher->hashPassword($user, (string) $data['password']));
        $entities->persist($user);
        $entities->flush();

        return $this->json($this->userData($user), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id<\\d+>}', name: 'api_admin_users_update', methods: ['PATCH'])]
    public function update(
        int $id,
        Request $request,
        JsonInput $input,
        UserRepository $users,
        EntityManagerInterface $entities,
        UserPasswordHasherInterface $hasher,
    ): JsonResponse {
        $user = $users->find($id);
        if (!$user instanceof User) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: false);
        if (isset($data['email'])) {
            $email = mb_strtolower(trim((string) $data['email']));
            $existing = $users->findOneBy(['email' => $email]);
            if ($existing instanceof User && $existing->getId() !== $user->getId()) {
                $errors['email'] = 'Ese email ya está en uso.';
            }
        }
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        if (array_key_exists('email', $data)) {
            $user->changeEmail((string) $data['email']);
        }
        if (array_key_exists('name', $data)) {
            $user->changeName((string) $data['name']);
        }
        if (array_key_exists('role', $data)) {
            $user->changeRole((string) $data['role']);
        }
        if (array_key_exists('active', $data)) {
            $user->setActive((bool) $data['active']);
        }
        if (isset($data['password'])) {
            $user->setPassword($hasher->hashPassword($user, (string) $data['password']));
        }
        $entities->flush();

        return $this->json($this->userData($user));
    }

    #[Route('/{id<\\d+>}', name: 'api_admin_users_deactivate', methods: ['DELETE'])]
    public function deactivate(int $id, UserRepository $users, EntityManagerInterface $entities): JsonResponse
    {
        $user = $users->find($id);
        if (!$user instanceof User) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $user->setActive(false);
        $entities->flush();

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function validate(array $data, bool $creating): array
    {
        $errors = [];
        if ($creating || array_key_exists('email', $data)) {
            if (!filter_var(mb_strtolower(trim((string) ($data['email'] ?? ''))), FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Ingresá un email válido.';
            }
        }
        if ($creating || array_key_exists('name', $data)) {
            if (trim((string) ($data['name'] ?? '')) === '') {
                $errors['name'] = 'El nombre es obligatorio.';
            }
        }
        if ($creating || array_key_exists('role', $data)) {
            if (!in_array($data['role'] ?? null, ['admin', 'veterinarian'], true)) {
                $errors['role'] = 'El rol no es válido.';
            }
        }
        if ($creating || array_key_exists('password', $data)) {
            if (mb_strlen((string) ($data['password'] ?? '')) < 12) {
                $errors['password'] = 'Usá al menos 12 caracteres.';
            }
        }
        if (array_key_exists('active', $data) && !is_bool($data['active'])) {
            $errors['active'] = 'El estado debe ser verdadero o falso.';
        }

        return $errors;
    }

    private function userData(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'role' => $user->getRole(),
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $user->getUpdatedAt()->format(DATE_ATOM),
        ];
    }
}
