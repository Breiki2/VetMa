<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261031092000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add indexes for owner-scoped searches and clinical timelines.'; }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_client_owner_phone ON Client (owner_id, phone)');
        $this->addSql('CREATE INDEX idx_client_owner_email ON Client (owner_id, email)');
        $this->addSql('CREATE INDEX idx_patient_name_client ON Patient (name, client_id)');
        $this->addSql('CREATE INDEX idx_attention_patient_datetime ON Attention (patient_id, dateTime)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_client_owner_phone');
        $this->addSql('DROP INDEX idx_client_owner_email');
        $this->addSql('DROP INDEX idx_patient_name_client');
        $this->addSql('DROP INDEX idx_attention_patient_datetime');
    }
}
