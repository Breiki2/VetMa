<?php

namespace App\Security;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class CsrfRequestSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly CsrfTokenManagerInterface $tokens)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['validateMutation', 9]];
    }

    public function validateMutation(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        if (in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        if ($request->getPathInfo() === '/api/login' && $request->isMethod('POST')) {
            return;
        }

        $token = $request->headers->get('X-CSRF-Token');
        if (!is_string($token) || !$this->tokens->isTokenValid(new CsrfToken('api', $token))) {
            $event->setResponse(new JsonResponse(['error' => 'csrf_token_invalid'], 419));
        }
    }
}
