<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class JsonInput
{
    public function read(Request $request): array
    {
        try {
            $data = $request->toArray();
        } catch (\JsonException) {
            throw new BadRequestHttpException('El cuerpo debe ser JSON válido.');
        }

        if (!is_array($data) || array_is_list($data)) {
            throw new BadRequestHttpException('El cuerpo debe ser un objeto JSON.');
        }

        return $data;
    }
}
