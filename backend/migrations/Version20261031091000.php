<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261031091000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add vaccine email reminders.'; }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE VaccineReminder (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, scheduledAt DATE NOT NULL, status VARCHAR(20) NOT NULL, attempts INTEGER DEFAULT 0 NOT NULL, lastAttemptAt DATETIME DEFAULT NULL, sentAt DATETIME DEFAULT NULL, lastError CLOB DEFAULT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, application_id INTEGER NOT NULL, CONSTRAINT FK_REMINDER_APPLICATION FOREIGN KEY (application_id) REFERENCES VaccineApplication (id) ON DELETE CASCADE)');
        $this->addSql('CREATE UNIQUE INDEX uniq_reminder_application ON VaccineReminder (application_id)');
        $this->addSql('CREATE INDEX idx_reminder_due ON VaccineReminder (status, scheduledAt)');
    }

    public function down(Schema $schema): void { $this->addSql('DROP TABLE VaccineReminder'); }
}
