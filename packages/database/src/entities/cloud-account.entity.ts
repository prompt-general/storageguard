// packages/database/src/entities/cloud-account.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { StorageResource } from './storage-resource.entity';

export enum CloudProvider {
    AWS = 'aws',
    AZURE = 'azure',
    GCP = 'gcp',
}

@Entity('cloud_account')
export class CloudAccount extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({
        type: 'enum',
        enum: CloudProvider,
    })
    provider: CloudProvider;

    @Column({ type: 'text' })
    external_id: string;

    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'jsonb', nullable: true })
    credentials: {
        role_arn?: string; // AWS
        service_principal_id?: string; // Azure
        service_account_key?: string; // GCP (encrypted)
    };

    @Column({ type: 'jsonb', nullable: true })
    config: Record<string, any>;

    @Column({ type: 'boolean', default: false })
    is_active: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    last_scanned_at: Date;

    @ManyToOne(() => Tenant, (tenant) => tenant.cloud_accounts)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @OneToMany(() => StorageResource, (resource) => resource.cloud_account)
    storage_resources: StorageResource[];
}