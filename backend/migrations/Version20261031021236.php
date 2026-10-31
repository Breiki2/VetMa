<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261031021236 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema for accounts, clients, patients, vaccines and attention records.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE Attention (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, dateTime DATETIME NOT NULL, types CLOB NOT NULL, reason VARCHAR(255) DEFAULT NULL, observations CLOB DEFAULT NULL, chargedAmount NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, debtAmount NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, patient_id INTEGER NOT NULL, CONSTRAINT FK_8AD2C32E6B899279 FOREIGN KEY (patient_id) REFERENCES Patient (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_8AD2C32E6B899279 ON Attention (patient_id)');
        $this->addSql('CREATE TABLE Client (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(120) NOT NULL, surname VARCHAR(120) NOT NULL, phone VARCHAR(40) NOT NULL, email VARCHAR(180) DEFAULT NULL, address VARCHAR(255) DEFAULT NULL, notes CLOB DEFAULT NULL, archived BOOLEAN DEFAULT 0 NOT NULL, remindersOptOut BOOLEAN DEFAULT 0 NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, owner_id INTEGER NOT NULL, CONSTRAINT FK_C0E801637E3C61F9 FOREIGN KEY (owner_id) REFERENCES app_user (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_client_owner_name ON Client (owner_id, surname, name)');
        $this->addSql('CREATE INDEX IDX_C0E801637E3C61F9 ON Client (owner_id)');
        $this->addSql('CREATE TABLE Patient (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(120) NOT NULL, species VARCHAR(10) NOT NULL, breed VARCHAR(120) DEFAULT NULL, sex VARCHAR(10) NOT NULL, birthDate DATE DEFAULT NULL, approximateAge VARCHAR(80) DEFAULT NULL, castrated BOOLEAN NOT NULL, archived BOOLEAN DEFAULT 0 NOT NULL, deceased BOOLEAN DEFAULT 0 NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, client_id INTEGER NOT NULL, CONSTRAINT FK_D567EE7719EB6921 FOREIGN KEY (client_id) REFERENCES Client (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_patient_client_name ON Patient (client_id, name)');
        $this->addSql('CREATE INDEX IDX_D567EE7719EB6921 ON Patient (client_id)');
        $this->addSql('CREATE TABLE Vaccine (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(120) NOT NULL, species VARCHAR(10) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX uniq_vaccine_name ON Vaccine (name)');
        $this->addSql('CREATE TABLE VaccineApplication (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, appliedAt DATETIME NOT NULL, batchNumber VARCHAR(80) DEFAULT NULL, observations CLOB DEFAULT NULL, attention_id INTEGER NOT NULL, vaccine_id INTEGER NOT NULL, CONSTRAINT FK_65EF8B77C4A942DD FOREIGN KEY (attention_id) REFERENCES Attention (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_65EF8B772BFE75C3 FOREIGN KEY (vaccine_id) REFERENCES Vaccine (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_65EF8B77C4A942DD ON VaccineApplication (attention_id)');
        $this->addSql('CREATE INDEX IDX_65EF8B772BFE75C3 ON VaccineApplication (vaccine_id)');
        $this->addSql('CREATE TABLE app_user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(180) NOT NULL, role VARCHAR(20) NOT NULL, active BOOLEAN NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX uniq_app_user_email ON app_user (email)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE Attention');
        $this->addSql('DROP TABLE Client');
        $this->addSql('DROP TABLE Patient');
        $this->addSql('DROP TABLE Vaccine');
        $this->addSql('DROP TABLE VaccineApplication');
        $this->addSql('DROP TABLE app_user');
    }
}
