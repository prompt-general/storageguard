"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserAndUpdateRLS1700000000001 = void 0;
class CreateUserAndUpdateRLS1700000000001 {
    constructor() {
        this.name = 'CreateUserAndUpdateRLS1700000000001';
    }
    async up(queryRunner) {
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
        await queryRunner.query(`ALTER TABLE "user" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY tenant_isolation ON tenant
        USING (id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
        await queryRunner.query(`
      CREATE POLICY cloud_account_isolation ON cloud_account
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
        await queryRunner.query(`
      CREATE POLICY storage_resource_isolation ON storage_resource
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
        await queryRunner.query(`
      CREATE POLICY finding_isolation ON finding
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
        await queryRunner.query(`
      CREATE POLICY remediation_action_isolation ON remediation_action
        USING (finding_id IN (
          SELECT id FROM finding WHERE tenant_id IN (
            SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text
          )
        ))
    `);
        await queryRunner.query(`
      CREATE POLICY user_isolation ON "user"
        USING (tenant_id IN (SELECT tenant_id FROM "user" WHERE auth0_id = current_setting('app.current_auth0_id', true)::text))
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
    }
}
exports.CreateUserAndUpdateRLS1700000000001 = CreateUserAndUpdateRLS1700000000001;
//# sourceMappingURL=1700000000001-CreateUserAndUpdateRLS.js.map