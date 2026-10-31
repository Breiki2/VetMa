<?php

namespace App\History;

use App\Entity\Attention;
use App\Entity\Patient;

final class PatientHistoryPdf
{
    /** @param list<Attention> $attentions */
    public function generate(Patient $patient, array $attentions): string
    {
        $this->pages = [[]];
        $this->y = 790;
        $this->line('VetMa · Historial clínico', 19, true, 50);
        $this->line($patient->getName(), 16, true);
        $client = $patient->getClient();
        $this->line(sprintf('%s · %s · Cliente: %s %s', $patient->getSpecies() === 'dog' ? 'Perro' : 'Gato', $patient->getBreed() ?: 'Raza no indicada', $client->getName(), $client->getSurname()));
        $this->line(sprintf('Sexo: %s · Castrado/a: %s · Nacimiento: %s · Edad aproximada: %s', $this->sex($patient->getSex()), $patient->isCastrated() ? 'Sí' : 'No', $patient->getBirthDate()?->format('d/m/Y') ?? 'No informado', $patient->getApproximateAge() ?? 'No informada'));
        $this->line(sprintf('Teléfono del cliente: %s · Email: %s', $client->getPhone(), $client->getEmail() ?? 'No informado'));
        $this->line('Emitido el '.(new \DateTimeImmutable('now', new \DateTimeZone('America/Argentina/Buenos_Aires')))->format('d/m/Y'), 10);
        $this->line('');
        $this->line('Cronología de atenciones', 14, true);

        foreach ($attentions as $attention) {
            $this->line($attention->getDateTime()->setTimezone(new \DateTimeZone('America/Argentina/Buenos_Aires'))->format('d/m/Y H:i').' · '.implode(' + ', $attention->getTypes()), 12, true);
            if ($attention->getReason()) $this->paragraph('Motivo: '.$attention->getReason());
            if ($attention->getObservations()) $this->paragraph('Observaciones clínicas: '.$attention->getObservations());
            if ($attention->getUltrasoundReport()) $this->paragraph('Informe de ecografía: '.$attention->getUltrasoundReport());
            foreach ($attention->getVaccineApplications() as $application) {
                $this->paragraph(sprintf('Vacuna: %s · Aplicada el %s%s', $application->getVaccine()->getName(), $application->getAppliedAt()->format('d/m/Y'), $application->getBatchNumber() ? ' · Lote: '.$application->getBatchNumber() : ''));
                if ($application->getObservations()) $this->paragraph('Observaciones de vacuna: '.$application->getObservations());
            }
            $this->line(sprintf('Cobrado: $%s · Adeudado: $%s', $attention->getChargedAmount(), $attention->getDebtAmount()), 10);
            $this->line('');
        }

        if ($attentions === []) $this->line('No hay atenciones registradas.');
        return $this->render();
    }

    /** @var list<list<string>> */
    private array $pages = [];
    private int $y = 790;

    private function paragraph(string $text): void
    {
        foreach (explode("\n", wordwrap($text, 80, "\n", true)) as $line) $this->line($line, 11, false, 64);
    }

    private function line(string $text, int $size = 11, bool $bold = false, int $x = 50): void
    {
        if ($this->y < 55) {
            $this->pages[] = [];
            $this->y = 790;
        }
        $font = $bold ? 'F2' : 'F1';
        $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);
        if ($encoded === false) $encoded = '?';
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
        $this->pages[array_key_last($this->pages)][] = sprintf('BT /%s %d Tf %d %d Td (%s) Tj ET', $font, $size, $x, $this->y, $escaped);
        $this->y -= $size + 5;
    }

    private function sex(string $sex): string
    {
        return ['female' => 'Hembra', 'male' => 'Macho', 'unknown' => 'No indicado'][$sex] ?? $sex;
    }

    private function render(): string
    {
        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $pageIds = [];
        $nextId = 5;
        foreach ($this->pages as $index => $commands) {
            $pageId = $nextId++;
            $contentId = $nextId++;
            $pageIds[] = $pageId.' 0 R';
            $stream = implode("\n", $commands);
            $objects[$pageId] = sprintf('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents %d 0 R >>', $contentId);
            $objects[$contentId] = sprintf("<< /Length %d >>\nstream\n%s\nendstream", strlen($stream), $stream);
        }
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $pageIds).'] /Count '.count($pageIds).' >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        ksort($objects);
        $pdf = "%PDF-1.4\n% VetMa\n";
        $offsets = [0];
        foreach ($objects as $id => $object) {
            $offsets[$id] = strlen($pdf);
            $pdf .= sprintf("%d 0 obj\n%s\nendobj\n", $id, $object);
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        for ($id = 1; $id <= count($objects); $id++) $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        $pdf .= sprintf("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", count($objects) + 1, $xref);
        return $pdf;
    }
}
