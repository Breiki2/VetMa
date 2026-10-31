<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Vaccine;
use App\Http\JsonInput;
use App\Repository\VaccineRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/vaccines')]
final class VaccineController extends AbstractController
{
    #[Route('', name: 'api_vaccines_list', methods: ['GET'])]
    public function list(Request $request, VaccineRepository $vaccines): JsonResponse
    {
        $user = $this->getUser();
        $species = $request->query->getString('species');
        if (!in_array($species, ['', 'dog', 'cat'], true)) {
            return $this->json(['error' => 'validation_failed', 'details' => ['species' => 'La especie no es válida.']], 422);
        }

        $includeInactive = $user instanceof User && $user->getRole() === 'admin';
        $items = $species === ''
            ? $vaccines->findBy($includeInactive ? [] : ['active' => true], ['name' => 'ASC'])
            : $vaccines->availableFor($species, $includeInactive);

        return $this->json(array_map($this->vaccineData(...), $items));
    }

    #[Route('', name: 'api_vaccines_create', methods: ['POST'])]
    public function create(Request $request, JsonInput $input, VaccineRepository $vaccines, EntityManagerInterface $entities): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $data = $input->read($request);
        $errors = $this->validate($data, creating: true);
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }
        if ($vaccines->findOneBy(['name' => trim((string) $data['name'])]) instanceof Vaccine) {
            return $this->json(['error' => 'validation_failed', 'details' => ['name' => 'Ya existe una vacuna con ese nombre.']], 422);
        }

        $vaccine = new Vaccine((string) $data['name'], (string) $data['species']);
        $entities->persist($vaccine);
        $entities->flush();

        return $this->json($this->vaccineData($vaccine), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id<\\d+>}', name: 'api_vaccines_update', methods: ['PATCH'])]
    public function update(int $id, Request $request, JsonInput $input, VaccineRepository $vaccines, EntityManagerInterface $entities): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $vaccine = $vaccines->find($id);
        if (!$vaccine instanceof Vaccine) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $data = $input->read($request);
        $errors = $this->validate($data, creating: false);
        if (isset($data['name'])) {
            $existing = $vaccines->findOneBy(['name' => trim((string) $data['name'])]);
            if ($existing instanceof Vaccine && $existing->getId() !== $id) {
                $errors['name'] = 'Ya existe una vacuna con ese nombre.';
            }
        }
        if ($errors !== []) {
            return $this->json(['error' => 'validation_failed', 'details' => $errors], 422);
        }

        $vaccine->update($data);
        $entities->flush();

        return $this->json($this->vaccineData($vaccine));
    }

    #[Route('/{id<\\d+>}', name: 'api_vaccines_deactivate', methods: ['DELETE'])]
    public function deactivate(int $id, VaccineRepository $vaccines, EntityManagerInterface $entities): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $vaccine = $vaccines->find($id);
        if (!$vaccine instanceof Vaccine) {
            return $this->json(['error' => 'not_found'], 404);
        }

        $vaccine->update(['active' => false]);
        $entities->flush();

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function validate(array $data, bool $creating): array
    {
        $errors = [];
        if (($creating || array_key_exists('name', $data)) && trim((string) ($data['name'] ?? '')) === '') {
            $errors['name'] = 'El nombre es obligatorio.';
        }
        if (($creating || array_key_exists('species', $data)) && !in_array($data['species'] ?? null, ['dog', 'cat', 'both'], true)) {
            $errors['species'] = 'La especie debe ser dog, cat o both.';
        }
        if (array_key_exists('active', $data) && !is_bool($data['active'])) {
            $errors['active'] = 'El estado debe ser verdadero o falso.';
        }

        return $errors;
    }

    private function vaccineData(Vaccine $vaccine): array
    {
        return [
            'id' => $vaccine->getId(),
            'name' => $vaccine->getName(),
            'species' => $vaccine->getSpecies(),
            'active' => $vaccine->isActive(),
        ];
    }
}
