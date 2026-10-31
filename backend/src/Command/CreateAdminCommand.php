<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:admin:create', description: 'Crea una cuenta administradora de forma interactiva.')]
final class CreateAdminCommand extends Command
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $entities,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $helper = $this->getHelper('question');
        $email = mb_strtolower(trim((string) $helper->ask($input, $output, new Question('Email del administrador: '))));
        $name = trim((string) $helper->ask($input, $output, new Question('Nombre: ')));
        $passwordQuestion = new Question('Contraseña (mínimo 12 caracteres): ');
        $passwordQuestion->setHidden(true);
        $passwordQuestion->setHiddenFallback(false);
        $password = (string) $helper->ask($input, $output, $passwordQuestion);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '' || mb_strlen($password) < 12) {
            $output->writeln('<error>Email, nombre o contraseña no válidos.</error>');
            return Command::INVALID;
        }
        if ($this->users->findOneBy(['email' => $email]) instanceof User) {
            $output->writeln('<error>Ya existe una cuenta con ese email.</error>');
            return Command::FAILURE;
        }

        $admin = new User($email, $name, 'admin');
        $admin->setPassword($this->hasher->hashPassword($admin, $password));
        $this->entities->persist($admin);
        $this->entities->flush();
        $output->writeln('<info>Cuenta administradora creada.</info>');
        return Command::SUCCESS;
    }
}
