// packages/database/src/entities/control.entity.ts
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FindingSeverity } from './finding.entity';

@Entity('control')
export class Control extends BaseEntity {
    @Column({ type: 'text', primary: true })
    id: string;

    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: FindingSeverity,
    })
    base_severity: FindingSeverity;

    @Column({ type: 'jsonb', nullable: true })
    provider_specific: {
        aws?: {
            service: string;
            check_type: string;
        };
        azure?: {
            resource_type: string;
            check_type: string;
        };
        gcp?: {
            service: string;
            check_type: string;
        };
    };

    @Column({ type: 'jsonb', nullable: true })
    compliance_mapping: {
        cis?: string[];
        soc2?: string[];
        iso27001?: string[];
        nist?: string[];
    };
}