import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAndUpdateRLS1700000000001 implements MigrationInterface {
    name = 'CreateUserAndUpdateRLS1700000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user table
        await queryRunner.query(`
      CREATE TABLE "user" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'security_engineer', 'platform_engineer', 'viewer')),
        auth0_id TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Enable RLS on user table
        await queryRunner.query(`ALTER TABLE "user" ENABLE ROW LEVEL SECURITY`);

        // Create RLS policies for all tables
        // Tenant isolation: users can only see rows from their tenant

        // For tenant table - only allow if user belongs to that tenant (via subquery)
        await queryRunner.query(`
      CREATE POLICY tenant_isolation ON tenant
        USING (id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);

        // For cloud_account
        await queryRunner.query(`
      CREATE POLICY cloud_account_isolation ON cloud_account
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);

        // For storage_resource
        await queryRunner.query(`
      CREATE POLICY storage_resource_isolation ON storage_resource
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);

        // For finding
        await queryRunner.query(`
      CREATE POLICY finding_isolation ON finding
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);

        // For remediation_action
        await queryRunner.query(`
      CREATE POLICY remediation_action_isolation ON remediation_action
        USING (finding_id IN (
          SELECT id FROM finding WHERE tenant_id IN (
            SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text
          )
        ))
    `);

        // For user table itself
        await queryRunner.query(`
      CREATE POLICY user_isolation ON "user"
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
        // Policies are dropped with tables
    }
}
