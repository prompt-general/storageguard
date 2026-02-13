// packages/database/src/entities/tenant.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CloudAccount } from './cloud-account.entity';
import { User } from './user.entity';

@Entity('tenant')
export class Tenant extends BaseEntity {
    @Column({ type: 'text', unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => CloudAccount, (account) => account.tenant)
    cloud_accounts: CloudAccount[];

    @OneToMany(() => User, (user) => user.tenant)
    users: User[];
}