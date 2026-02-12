// packages/database/src/migrations/1700000000000-CreateInitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1700000000000 implements MigrationInterface {
    name = 'CreateInitialSchema1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create tenant table
        await queryRunner.query(`
      CREATE TABLE tenant (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create cloud_account table
        await queryRunner.query(`
      CREATE TABLE cloud_account (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        provider VARCHAR(10) NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp')),
        external_id TEXT NOT NULL,
        name TEXT NOT NULL,
        credentials JSONB,
        config JSONB,
        is_active BOOLEAN DEFAULT FALSE,
        last_scanned_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create storage_resource table
        await queryRunner.query(`
      CREATE TABLE storage_resource (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES cloud_account(id) ON DELETE CASCADE,
        provider VARCHAR(10) NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp')),
        resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('bucket', 'container')),
        resource_id TEXT NOT NULL,
        region TEXT NOT NULL,
        configuration JSONB,
        discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_modified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, resource_id, provider)
      )
    `);

        // Create control table
        await queryRunner.query(`
      CREATE TABLE control (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        base_severity VARCHAR(10) NOT NULL CHECK (base_severity IN ('info', 'low', 'medium', 'high', 'critical')),
        provider_specific JSONB,
        compliance_mapping JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create finding table
        await queryRunner.query(`
      CREATE TABLE finding (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        resource_id UUID NOT NULL REFERENCES storage_resource(id) ON DELETE CASCADE,
        control_id TEXT NOT NULL REFERENCES control(id),
        severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
        risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'suppressed', 'fixed')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB NOT NULL,
        remediation_available BOOLEAN DEFAULT FALSE,
        remediation_guidance TEXT,
        detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource_id, control_id)
      )
    `);

        // Create remediation_action table
        await queryRunner.query(`
      CREATE TABLE remediation_action (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        finding_id UUID NOT NULL REFERENCES finding(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
          'remove_public_access',
          'enable_encryption',
          'enable_versioning',
          'enable_logging',
          'update_policy'
        )),
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
          'pending',
          'dry_run_completed',
          'executed',
          'failed',
          'rolled_back'
        )),
        parameters JSONB NOT NULL,
        previous_state JSONB,
        new_state JSONB,
        execution_result JSONB,
        executed_at TIMESTAMP WITH TIME ZONE,
        executed_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes
        await queryRunner.query(`
      CREATE INDEX idx_finding_tenant_status ON finding(tenant_id, status);
      CREATE INDEX idx_finding_detected_at ON finding(detected_at);
      CREATE INDEX idx_storage_resource_tenant_account ON storage_resource(tenant_id, provider, account_id);
      CREATE INDEX idx_cloud_account_tenant ON cloud_account(tenant_id);
    `);

        // Enable Row-Level Security
        await queryRunner.query(`
      ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cloud_account ENABLE ROW LEVEL SECURITY;
      ALTER TABLE storage_resource ENABLE ROW LEVEL SECURITY;
      ALTER TABLE finding ENABLE ROW LEVEL SECURITY;
      ALTER TABLE remediation_action ENABLE ROW LEVEL SECURITY;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS remediation_action CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS finding CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS control CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS storage_resource CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS cloud_account CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS tenant CASCADE`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
}