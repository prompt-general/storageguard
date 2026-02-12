// packages/database/src/entities/remediation-action.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Finding } from './finding.entity';

export enum RemediationActionType {
    REMOVE_PUBLIC_ACCESS = 'remove_public_access',
    ENABLE_ENCRYPTION = 'enable_encryption',
    ENABLE_VERSIONING = 'enable_versioning',
    ENABLE_LOGGING = 'enable_logging',
    UPDATE_POLICY = 'update_policy',
}

export enum RemediationStatus {
    PENDING = 'pending',
    DRY_RUN_COMPLETED = 'dry_run_completed',
    EXECUTED = 'executed',
    FAILED = 'failed',
    ROLLED_BACK = 'rolled_back',
}

@Entity('remediation_action')
export class RemediationAction extends BaseEntity {
    @Column({ type: 'uuid' })
    finding_id: string;

    @Column({
        type: 'enum',
        enum: RemediationActionType,
    })
    action_type: RemediationActionType;

    @Column({
        type: 'enum',
        enum: RemediationStatus,
        default: RemediationStatus.PENDING,
    })
    status: RemediationStatus;

    @Column({ type: 'jsonb' })
    parameters: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    previous_state: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    new_state: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    execution_result: Record<string, any>;

    @Column({ type: 'timestamptz', nullable: true })
    executed_at: Date;

    @Column({ type: 'uuid', nullable: true })
    executed_by: string;

    @ManyToOne(() => Finding, (finding) => finding.id)
    @JoinColumn({ name: 'finding_id' })
    finding: Finding;
}