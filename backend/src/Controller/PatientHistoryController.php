<?php

namespace App\Controller;

use App\Entity\Patient;
use App\Entity\User;
use App\History\PatientHistoryPdf;
use App\Repository\AttentionRepository;
use App\Repository\PatientRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class PatientHistoryController extends AbstractController
{
    #[Route('/api/patients/{id<\d+>}/history.pdf', methods: ['GET'])]
    public function export(int $id, PatientRepository $patients, AttentionRepository $attentions, PatientHistoryPdf $pdf): Response
    {
        $user = $this->getUser();
        $patient = $user instanceof User ? $patients->findOwnedBy($id, $user) : null;
        if (!$patient instanceof Patient) return $this->json(['error' => 'not_found'], 404);
        $name = preg_replace('/[^A-Za-z0-9_-]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $patient->getName()) ?: 'paciente');
        return new Response($pdf->generate($patient, $attentions->findForPatient($patient)), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="historial-'.$name.'.pdf"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
