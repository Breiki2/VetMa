<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261031093000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add creation and modification timestamps to vaccine applications and attachments.'; }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE VaccineApplication ADD createdAt DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00'");
        $this->addSql("ALTER TABLE VaccineApplication ADD updatedAt DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00'");
        $this->addSql('UPDATE VaccineApplication SET createdAt = appliedAt, updatedAt = appliedAt');
        $this->addSql("ALTER TABLE AttentionAttachment ADD updatedAt DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00'");
        $this->addSql('UPDATE AttentionAttachment SET updatedAt = createdAt');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE VaccineApplication DROP COLUMN updatedAt');
        $this->addSql('ALTER TABLE VaccineApplication DROP COLUMN createdAt');
        $this->addSql('ALTER TABLE AttentionAttachment DROP COLUMN updatedAt');
    }
}
