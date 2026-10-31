<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261031090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add ultrasound reports and private attention attachments.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE Attention ADD ultrasoundReport CLOB DEFAULT NULL');
        $this->addSql('CREATE TABLE AttentionAttachment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, originalName VARCHAR(255) NOT NULL, storedName VARCHAR(255) NOT NULL, mimeType VARCHAR(80) NOT NULL, size INTEGER NOT NULL, createdAt DATETIME NOT NULL, attention_id INTEGER NOT NULL, CONSTRAINT FK_ATTACHMENT_ATTENTION FOREIGN KEY (attention_id) REFERENCES Attention (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ATTACHMENT_STORED_NAME ON AttentionAttachment (storedName)');
        $this->addSql('CREATE INDEX idx_attachment_attention ON AttentionAttachment (attention_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE AttentionAttachment');
        $this->addSql('ALTER TABLE Attention DROP ultrasoundReport');
    }
}
