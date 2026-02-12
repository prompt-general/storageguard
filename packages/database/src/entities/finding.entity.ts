// packages/database/src/entities/finding.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StorageResource } from './storage-resource.entity';

export enum FindingSeverity {
    INFO = 'info',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum FindingStatus {
    OPEN = 'open',
    RESOLVED = 'resolved',
    SUPPRESSED = 'suppressed',
    FIXED = 'fixed',
}

@Entity('finding')
@Index(['tenant_id', 'status'])
@Index(['resource_id', 'control_id'], { unique: true })
@Index(['detected_at'])
export class Finding extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'uuid' })
    resource_id: string;

    @Column({ type: 'text' })
    control_id: string;

    @Column({
        type: 'enum',
        enum: FindingSeverity,
    })
    severity: FindingSeverity;

    @Column({ type: 'integer' })
    risk_score: number; // 0-100

    @Column({
        type: 'enum',
        enum: FindingStatus,
        default: FindingStatus.OPEN,
    })
    status: FindingStatus;

    @Column({ type: 'text' })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'jsonb' })
    evidence: Record<string, any>;

    @Column({ type: 'boolean', default: false })
    remediation_available: boolean;

    @Column({ type: 'text', nullable: true })
    remediation_guidance: string;

    @Column({ type: 'timestamptz' })
    detected_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    resolved_at: Date;

    @Column({ type: 'timestamptz' })
    last_seen_at: Date;

    @ManyToOne(() => StorageResource, (resource) => resource.findings)
    @JoinColumn({ name: 'resource_id' })
    storage_resource: StorageResource;
}