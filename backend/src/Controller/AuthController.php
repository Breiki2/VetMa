<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class AuthController
{
    #[Route('/api/csrf-token', name: 'api_csrf_token', methods: ['GET'])]
    public function csrfToken(CsrfTokenManagerInterface $tokens): JsonResponse
    {
        return new JsonResponse(['csrfToken' => $tokens->getToken('api')->getValue()]);
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return new JsonResponse(['error' => 'invalid_credentials'], JsonResponse::HTTP_UNAUTHORIZED);
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
