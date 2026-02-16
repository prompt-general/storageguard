import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
export declare enum UserRole {
    ADMIN = "admin",
    SECURITY_ENGINEER = "security_engineer",
    PLATFORM_ENGINEER = "platform_engineer",
    VIEWER = "viewer"
}
export declare class User extends BaseEntity {
    tenant_id: string;
    email: string;
    name: string;
    role: UserRole;
    auth0_id: string;
    is_active: boolean;
    last_login_at: Date;
    tenant: Tenant;
}
