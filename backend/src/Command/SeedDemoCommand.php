<?php

namespace App\Command;

use App\Attention\AttentionRegistration;
use App\Entity\Client;
use App\Entity\Patient;
use App\Entity\User;
use App\Entity\Vaccine;
use App\Repository\UserRepository;
use App\Repository\VaccineRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:seed:demo', description: 'Carga clientes, pacientes, deudas y vacunas de prueba.')]
final class SeedDemoCommand extends Command
{
    private const TIMEZONE = 'America/Argentina/Buenos_Aires';
    private const CLIENT_EMAIL_DOMAIN = 'seed.vetma.test';

    private const NAMES = [
        'Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gabriela', 'Hernán',
        'Inés', 'Javier', 'Karina', 'Lucas', 'Mariana', 'Nicolás', 'Olivia', 'Pablo',
        'Rocío', 'Santiago', 'Tamara', 'Ulises', 'Valentina', 'Walter', 'Ximena',
        'Yamil', 'Zoe', 'Agustín', 'Belén', 'Camilo', 'Delfina', 'Emiliano',
    ];

    private const SURNAMES = [
        'Gómez', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'García',
        'Sánchez', 'Romero', 'Díaz', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta',
        'Benítez', 'Medina', 'Herrera', 'Aguirre', 'Pereyra', 'Giménez', 'Silva',
        'Sosa', 'Molina', 'Ortiz', 'Castro', 'Ríos', 'Blanco', 'Navarro', 'Vega',
    ];

    private const PET_NAMES = [
        'Mora', 'Toby', 'Luna', 'Simba', 'Nala', 'Rocky', 'Canela', 'Michi',
        'Rocco', 'Kiara', 'Rocco', 'Coco', 'Milo', 'Chloe', 'Toto', 'Pelusa',
        'Felipe', 'Atenea', 'Bruno', 'Duna', 'Greta', 'Homero', 'Iris', 'Juno',
        'Kira', 'Lola', 'Manchas', 'Nina', 'Odin', 'Pepa', 'Quique', 'Rita',
        'Sasha', 'Trufa', 'Uma', 'Vito', 'Wanda', 'Yuki', 'Zamba', 'Ámbar',
    ];

    private const DOG_BREEDS = ['Mestizo', 'Labrador', 'Caniche', 'Bulldog', 'Border Collie', 'Salchicha', 'Golden Retriever'];
    private const CAT_BREEDS = ['Mestizo', 'Siamés', 'Persa', 'Naranja', 'Tricolor', 'Angora'];

    private const REASONS = [
        'Control anual', 'Vacunación', 'Consulta por vómitos', 'Control dermatológico',
        'Revisión de herida', 'Chequeo geriátrico', 'Consulta por cojera',
        'Control postoperatorio', 'Desparasitación', 'Consulta por alergia',
    ];

    private const OBSERVATIONS = [
        'Paciente estable, sin hallazgos relevantes.',
        'Se indicó tratamiento y control en dos semanas.',
        'Buena respuesta al tratamiento previo.',
        'Se solicitaron estudios complementarios.',
        'Sin signos de dolor a la palpación.',
    ];

    public function __construct(
        private readonly UserRepository $users,
        private readonly VaccineRepository $vaccines,
        private readonly EntityManagerInterface $entities,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly AttentionRegistration $registrations,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('owner', null, InputOption::VALUE_REQUIRED, 'Email del usuario dueño de los datos generados.')
            ->addOption('all-users', null, InputOption::VALUE_NONE, 'Genera los datos para todos los usuarios activos.')
            ->addOption('clients', null, InputOption::VALUE_REQUIRED, 'Cantidad de clientes a generar por usuario.', '30');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $owners = $this->resolveOwners(
            (string) $input->getOption('owner'),
            (bool) $input->getOption('all-users'),
            $output,
        );
        if ($owners === []) {
            return Command::FAILURE;
        }

        $clientCount = (int) $input->getOption('clients');
        if ($clientCount < 1 || $clientCount > 200) {
            $output->writeln('<error>La cantidad de clientes debe estar entre 1 y 200.</error>');

            return Command::INVALID;
        }

        $vaccines = $this->ensureVaccines($output);
        $totals = ['clients' => 0, 'patients' => 0, 'attentions' => 0, 'debts' => 0, 'reminders' => 0];

        foreach ($owners as $owner) {
            $counts = $this->seed($owner, $clientCount, $vaccines);
            foreach ($totals as $key => $value) {
                $totals[$key] = $value + $counts[$key];
            }

            $output->writeln(sprintf(
                '<info>Seed listo para %s:</info> %d clientes, %d pacientes, %d atenciones, %d con deuda, %d recordatorios.',
                $owner->getEmail(),
                $counts['clients'],
                $counts['patients'],
                $counts['attentions'],
                $counts['debts'],
                $counts['reminders'],
            ));

            if ($counts['clients'] === 0) {
                $output->writeln(sprintf('<comment>El seed de %s ya estaba cargado.</comment>', $owner->getEmail()));
            }
        }

        if (count($owners) > 1) {
            $output->writeln(sprintf(
                '<info>Total:</info> %d clientes, %d pacientes, %d atenciones, %d con deuda, %d recordatorios.',
                $totals['clients'],
                $totals['patients'],
                $totals['attentions'],
                $totals['debts'],
                $totals['reminders'],
            ));
        }

        return Command::SUCCESS;
    }

    /** @return list<User> */
    private function resolveOwners(string $email, bool $allUsers, OutputInterface $output): array
    {
        if ($allUsers) {
            $owners = $this->users->createQueryBuilder('user')
                ->andWhere('user.active = true')
                ->orderBy('user.id', 'ASC')
                ->getQuery()
                ->getResult();

            return $owners !== [] ? $owners : [$this->createDemoUser($output)];
        }

        $owner = $this->resolveOwner($email, $output);

        return $owner instanceof User ? [$owner] : [];
    }

    private function resolveOwner(string $email, OutputInterface $output): ?User
    {
        if ($email !== '') {
            $owner = $this->users->findOneBy(['email' => mb_strtolower(trim($email))]);
            if (!$owner instanceof User) {
                $output->writeln(sprintf('<error>No existe un usuario con el email %s.</error>', $email));

                return null;
            }

            return $owner;
        }

        $owner = $this->users->createQueryBuilder('user')
            ->andWhere('user.active = true')
            ->orderBy('user.id', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $owner instanceof User ? $owner : $this->createDemoUser($output);
    }

    private function createDemoUser(OutputInterface $output): User
    {
        $owner = new User('demo@vetma.test', 'Demo Vet', 'admin');
        $owner->setPassword($this->hasher->hashPassword($owner, 'Demo-VetMa-2026!'));
        $this->entities->persist($owner);
        $this->entities->flush();
        $output->writeln('<comment>No había usuarios; se creó demo@vetma.test con contraseña Demo-VetMa-2026!.</comment>');

        return $owner;
    }

    /** @return array<string, Vaccine> */
    private function ensureVaccines(OutputInterface $output): array
    {
        $definitions = [
            'Triple Felina' => 'cat',
            'Rabia' => 'both',
            'Quíntuple' => 'dog',
            'Séxtuple' => 'dog',
        ];

        $result = [];
        foreach ($definitions as $name => $species) {
            $vaccine = $this->vaccines->findOneBy(['name' => $name]);
            if (!$vaccine instanceof Vaccine) {
                $vaccine = new Vaccine($name, $species);
                $this->entities->persist($vaccine);
                $output->writeln(sprintf('Vacuna creada: %s (%s).', $name, $species));
            }
            $result[$name] = $vaccine;
        }
        $this->entities->flush();

        return $result;
    }

    /**
     * @param array<string, Vaccine> $vaccines
     * @return array{clients: int, patients: int, attentions: int, debts: int, reminders: int}
     */
    private function seed(User $owner, int $clientCount, array $vaccines): array
    {
        $tz = new \DateTimeZone(self::TIMEZONE);
        $counts = ['clients' => 0, 'patients' => 0, 'attentions' => 0, 'debts' => 0, 'reminders' => 0];
        $patientIndex = 0;

        for ($i = 1; $i <= $clientCount; $i++) {
            $phone = sprintf('+54 11 5555-%04d', $i);
            if ($this->entities->getRepository(Client::class)->findOneBy(['owner' => $owner, 'phone' => $phone]) instanceof Client) {
                continue;
            }

            $client = new Client(
                $owner,
                self::NAMES[($i - 1) % count(self::NAMES)],
                self::SURNAMES[($i - 1) % count(self::SURNAMES)],
                $phone,
            );
            $client->update([
                'email' => sprintf('cliente.%02d@%s', $i, self::CLIENT_EMAIL_DOMAIN),
                'address' => sprintf('Av. Siempreviva %d, CABA', 100 + $i * 7),
                'notes' => 'Cliente de prueba generado por app:seed:demo.',
                'remindersOptOut' => $i % 11 === 0,
            ]);
            $this->entities->persist($client);
            $counts['clients']++;

            $patientCount = 1 + (($i - 1) % 3);
            for ($j = 1; $j <= $patientCount; $j++) {
                $patientIndex++;
                $species = ($i + $j) % 2 === 0 ? 'cat' : 'dog';
                $patient = new Patient(
                    $client,
                    self::PET_NAMES[($patientIndex - 1) % count(self::PET_NAMES)],
                    $species,
                    $j % 3 === 0 ? 'unknown' : ($j % 2 === 0 ? 'male' : 'female'),
                    $j % 2 === 0,
                );
                $patient->update([
                    'breed' => $species === 'dog'
                        ? self::DOG_BREEDS[($patientIndex - 1) % count(self::DOG_BREEDS)]
                        : self::CAT_BREEDS[($patientIndex - 1) % count(self::CAT_BREEDS)],
                    'approximateAge' => sprintf('%d años', 1 + ($patientIndex % 12)),
                    'birthDate' => (new \DateTimeImmutable(sprintf('-%d years', 1 + ($patientIndex % 12)), $tz))->setTime(0, 0),
                ]);
                $this->entities->persist($patient);
                $counts['patients']++;

                $clinicalDate = new \DateTimeImmutable(sprintf('-%d days', 20 + ($patientIndex * 7) % 220), $tz);
                $clinicalDebt = ($i % 2 === 1 || $j === 1) ? number_format(3500 + ($patientIndex * 450) % 22000, 2, '.', '') : '0.00';
                $clinical = $this->registrations->create($patient, [
                    'dateTime' => $clinicalDate->format(DATE_ATOM),
                    'types' => ['atencion'],
                    'reason' => self::REASONS[($patientIndex - 1) % count(self::REASONS)],
                    'observations' => self::OBSERVATIONS[($patientIndex - 1) % count(self::OBSERVATIONS)],
                    'chargedAmount' => number_format(12000 + ($patientIndex * 1100) % 38000, 2, '.', ''),
                    'debtAmount' => $clinicalDebt,
                ]);
                if (!$clinical->isSuccessful()) {
                    continue;
                }
                $counts['attentions']++;
                if ($clinicalDebt !== '0.00') {
                    $counts['debts']++;
                }

                $appliedAt = new \DateTimeImmutable(
                    sprintf('-%d months -%d days', 1 + ($patientIndex % 14), $patientIndex % 25),
                    $tz,
                );
                $applications = [];
                if ($species === 'cat') {
                    $applications[] = ['vaccineId' => $vaccines['Triple Felina']->getId(), 'appliedAt' => $appliedAt->format('Y-m-d')];
                    $applications[] = ['vaccineId' => $vaccines['Rabia']->getId(), 'appliedAt' => $appliedAt->format('Y-m-d')];
                } else {
                    $applications[] = ['vaccineId' => $vaccines['Rabia']->getId(), 'appliedAt' => $appliedAt->format('Y-m-d')];
                    $applications[] = ['vaccineId' => $vaccines[($patientIndex % 2 === 0 ? 'Quíntuple' : 'Séxtuple')]->getId(), 'appliedAt' => $appliedAt->format('Y-m-d')];
                }

                $vaccineDebt = $i % 4 === 0 ? number_format(4000 + ($patientIndex * 300) % 9000, 2, '.', '') : '0.00';
                $vaccination = $this->registrations->create($patient, [
                    'dateTime' => $appliedAt->format(DATE_ATOM),
                    'types' => ['vacuna'],
                    'reason' => 'Vacunación anual',
                    'observations' => 'Aplicación registrada durante el seed de prueba.',
                    'chargedAmount' => number_format(6000 + ($patientIndex * 250) % 12000, 2, '.', ''),
                    'debtAmount' => $vaccineDebt,
                    'vaccineApplications' => $applications,
                ]);
                if (!$vaccination->isSuccessful()) {
                    continue;
                }
                $counts['attentions']++;
                if ($vaccineDebt !== '0.00') {
                    $counts['debts']++;
                }

                foreach ($vaccination->attention()->getVaccineApplications() as $application) {
                    $reminder = $application->getReminder();
                    if ($reminder === null) {
                        continue;
                    }
                    $counts['reminders']++;
                    if ($patientIndex % 9 === 0) {
                        $reminder->markSent(new \DateTimeImmutable(sprintf('-%d days', 5 + $patientIndex % 30), $tz));
                    } elseif ($patientIndex % 13 === 0) {
                        $reminder->markFailed(new \DateTimeImmutable(sprintf('-%d days', 3 + $patientIndex % 10), $tz), 'Error SMTP simulado por el seed.');
                        $reminder->markFailed(new \DateTimeImmutable(sprintf('-%d days', 2 + $patientIndex % 10), $tz), 'Error SMTP simulado por el seed.');
                        $reminder->markFailed(new \DateTimeImmutable('-1 day', $tz), 'Error SMTP simulado por el seed.');
                    } elseif ($patientIndex % 17 === 0) {
                        $reminder->cancel();
                    }
                }
                $this->entities->flush();
            }
        }

        return $counts;
    }
}
