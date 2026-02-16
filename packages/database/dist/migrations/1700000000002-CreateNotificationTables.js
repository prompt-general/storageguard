"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNotificationTables1700000000002 = void 0;
class CreateNotificationTables1700000000002 {
    constructor() {
        this.name = 'CreateNotificationTables1700000000002';
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "notification_channel" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "name" text NOT NULL,
                "type" text NOT NULL,
                "config" jsonb NOT NULL,
                "notify_on_severities" text,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_notification_channel" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "channel_id" uuid,
                "finding_id" uuid NOT NULL,
                "channel_type" text NOT NULL,
                "status" text NOT NULL,
                "error_message" text,
                "response" jsonb,
                CONSTRAINT "PK_notification_log" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_log" 
            ADD CONSTRAINT "FK_notification_log_channel" 
            FOREIGN KEY ("channel_id") REFERENCES "notification_channel"("id") ON DELETE SET NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_log" 
            ADD CONSTRAINT "FK_notification_log_finding" 
            FOREIGN KEY ("finding_id") REFERENCES "finding"("id") ON DELETE CASCADE
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notification_log" DROP CONSTRAINT "FK_notification_log_finding"`);
        await queryRunner.query(`ALTER TABLE "notification_log" DROP CONSTRAINT "FK_notification_log_channel"`);
        await queryRunner.query(`DROP TABLE "notification_log"`);
        await queryRunner.query(`DROP TABLE "notification_channel"`);
    }
}
exports.CreateNotificationTables1700000000002 = CreateNotificationTables1700000000002;
//# sourceMappingURL=1700000000002-CreateNotificationTables.js.map