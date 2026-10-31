<?php

namespace App\Command;

use App\Entity\VaccineReminder;
use App\Repository\VaccineReminderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[AsCommand(name: 'app:send-reminders', description: 'Envía los recordatorios de vacunación vencidos.')]
final class SendVaccineRemindersCommand extends Command
{
    public function __construct(
        private readonly VaccineReminderRepository $reminders,
        private readonly EntityManagerInterface $entities,
        private readonly MailerInterface $mailer,
        private readonly string $senderAddress,
    ) { parent::__construct(); }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $today = new \DateTimeImmutable('today', new \DateTimeZone('America/Argentina/Buenos_Aires'));
        $sent = 0;
        $failed = 0;
        foreach ($this->reminders->findDue($today) as $reminder) {
            $application = $reminder->getApplication();
            $attention = $application->getAttention();
            $patient = $attention->getPatient();
            $client = $patient->getClient();
            $owner = $client->getOwner();
            $date = $application->getAppliedAt()->setTimezone(new \DateTimeZone('America/Argentina/Buenos_Aires'))->format('d/m/Y');
            try {
                $email = (new Email())
                    ->from($this->senderAddress)
                    ->to((string) $client->getEmail())
                    ->replyTo($owner->getEmail())
                    ->subject('Recordatorio de vacunación de '.$patient->getName())
                    ->text(sprintf("Hola %s,\n\nTe recordamos que el día %s %s recibió la vacuna %s.\n\nPara coordinar una nueva aplicación, contactá a %s (%s).\nSi no querés recibir más recordatorios, respondé este correo solicitando la baja.\n", $client->getName(), $date, $patient->getName(), $application->getVaccine()->getName(), $owner->getName(), $owner->getEmail()));
                $this->mailer->send($email);
                $reminder->markSent(new \DateTimeImmutable());
                $sent++;
            } catch (\Throwable $error) {
                $reminder->markFailed(new \DateTimeImmutable(), $error->getMessage());
                $failed++;
            }
            $this->entities->flush();
        }
        $output->writeln(sprintf('Recordatorios enviados: %d; fallidos: %d.', $sent, $failed));
        return Command::SUCCESS;
    }
}
