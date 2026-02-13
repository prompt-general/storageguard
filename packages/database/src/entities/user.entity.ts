import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum UserRole {
    ADMIN = 'admin',
    SECURITY_ENGINEER = 'security_engineer',
    PLATFORM_ENGINEER = 'platform_engineer',
    VIEWER = 'viewer',
}

@Entity('user')
export class User extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'text', unique: true })
    email: string;

    @Column({ type: 'text' })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.VIEWER,
    })
    role: UserRole;

    @Column({ type: 'text', nullable: true })
    auth0_id: string; // External ID from OIDC provider

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    last_login_at: Date;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;
}
