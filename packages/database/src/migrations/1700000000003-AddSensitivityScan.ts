import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSensitivityScan1700000000003 implements MigrationInterface {
    name = 'AddSensitivityScan1700000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE storage_resource 
      ADD COLUMN sensitivity JSONB
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE storage_resource 
      DROP COLUMN sensitivity
    `);
    }
}
