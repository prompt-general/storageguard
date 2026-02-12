// packages/database/src/entities/storage-resource.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CloudAccount } from './cloud-account.entity';
import { Finding } from './finding.entity';

export enum ResourceType {
    BUCKET = 'bucket', // AWS S3, GCS
    CONTAINER = 'container', // Azure Blob
}

@Entity('storage_resource')
@Index(['tenant_id', 'provider', 'account_id'])
@Index(['tenant_id', 'resource_id', 'provider'], { unique: true })
export class StorageResource extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'uuid' })
    account_id: string;

    @Column({
        type: 'enum',
        enum: CloudProvider,
    })
    provider: CloudProvider;

    @Column({
        type: 'enum',
        enum: ResourceType,
    })
    resource_type: ResourceType;

    @Column({ type: 'text' })
    resource_id: string; // Bucket/container name

    @Column({ type: 'text' })
    region: string;

    @Column({ type: 'jsonb', nullable: true })
    configuration: {
        public_access: boolean;
        encryption_enabled: boolean;
        versioning_enabled: boolean;
        logging_enabled: boolean;
        policy: Record<string, any>;
        tags: Record<string, string>;
    };

    @Column({ type: 'timestamptz' })
    discovered_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    last_modified_at: Date;

    @ManyToOne(() => CloudAccount, (account) => account.storage_resources)
    @JoinColumn({ name: 'account_id' })
    cloud_account: CloudAccount;

    @OneToMany(() => Finding, (finding) => finding.storage_resource)
    findings: Finding[];
}