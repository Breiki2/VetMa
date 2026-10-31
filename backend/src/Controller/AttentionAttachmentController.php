<?php

namespace App\Controller;

use App\Entity\Attention;
use App\Entity\AttentionAttachment;
use App\Entity\User;
use App\Repository\AttentionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

final class AttentionAttachmentController extends AbstractController
{
    private const MAX_FILE_SIZE = 10_485_760;
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    public function __construct(private readonly string $attachmentDirectory)
    {
    }

    #[Route('/api/attentions/{id<\d+>}/attachments', methods: ['POST'])]
    public function upload(int $id, Request $request, AttentionRepository $attentions, EntityManagerInterface $entities): JsonResponse
    {
        $attention = $this->ownedAttention($id, $attentions);
        if (!$attention instanceof Attention) return $this->json(['error' => 'not_found'], 404);
        if (!in_array('ecografia', $attention->getTypes(), true)) return $this->json(['error' => 'ultrasound_required'], 422);

        $files = $request->files->all('files');
        if ($files === []) return $this->json(['error' => 'files_required'], 422);
        if ($attention->getAttachments()->count() + count($files) > 10) return $this->json(['error' => 'too_many_files'], 422);

        $validated = [];
        foreach ($files as $file) {
            if (!$file->isValid() || $file->getSize() > self::MAX_FILE_SIZE) return $this->json(['error' => 'file_too_large_or_invalid'], 422);
            $mimeType = $file->getMimeType();
            if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) return $this->json(['error' => 'unsupported_file_type'], 422);
            $validated[] = [$file, $mimeType, (int) $file->getSize()];
        }

        if (!is_dir($this->attachmentDirectory) && !mkdir($this->attachmentDirectory, 0700, true) && !is_dir($this->attachmentDirectory)) {
            return $this->json(['error' => 'storage_unavailable'], 500);
        }

        foreach ($validated as [$file, $mimeType, $size]) {
            $storedName = bin2hex(random_bytes(16));
            $file->move($this->attachmentDirectory, $storedName);
            $attachment = new AttentionAttachment(
                $attention,
                mb_substr(basename($file->getClientOriginalName()), 0, 255),
                $storedName,
                $mimeType,
                $size,
            );
            $attention->addAttachment($attachment);
            $entities->persist($attachment);
        }
        $entities->flush();

        return $this->json(['items' => array_map(static fn (AttentionAttachment $file) => ['id' => $file->getId(), 'name' => $file->getOriginalName(), 'mimeType' => $file->getMimeType(), 'size' => $file->getSize()], $attention->getAttachments()->toArray())], 201);
    }

    #[Route('/api/attentions/{attentionId<\d+>}/attachments/{id<\d+>}', methods: ['GET'])]
    public function download(int $attentionId, int $id, AttentionRepository $attentions, EntityManagerInterface $entities): BinaryFileResponse|JsonResponse
    {
        $attention = $this->ownedAttention($attentionId, $attentions);
        $attachment = $entities->getRepository(AttentionAttachment::class)->find($id);
        if (!$attention instanceof Attention || !$attachment instanceof AttentionAttachment || $attachment->getAttention() !== $attention) return $this->json(['error' => 'not_found'], 404);
        $path = $this->attachmentDirectory.'/'.$attachment->getStoredName();
        if (!is_file($path)) return $this->json(['error' => 'not_found'], 404);

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', $attachment->getMimeType());
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $attachment->getOriginalName());
        return $response;
    }

    #[Route('/api/attentions/{attentionId<\d+>}/attachments/{id<\d+>}', methods: ['DELETE'])]
    public function delete(int $attentionId, int $id, AttentionRepository $attentions, EntityManagerInterface $entities): JsonResponse
    {
        $attention = $this->ownedAttention($attentionId, $attentions);
        $attachment = $entities->getRepository(AttentionAttachment::class)->find($id);
        if (!$attention instanceof Attention || !$attachment instanceof AttentionAttachment || $attachment->getAttention() !== $attention) return $this->json(['error' => 'not_found'], 404);
        $path = $this->attachmentDirectory.'/'.$attachment->getStoredName();
        if (is_file($path)) unlink($path);
        $entities->remove($attachment);
        $entities->flush();
        return $this->json(null, 204);
    }

    private function ownedAttention(int $id, AttentionRepository $attentions): ?Attention
    {
        $user = $this->getUser();
        return $user instanceof User ? $attentions->findOwnedBy($id, $user) : null;
    }
}
