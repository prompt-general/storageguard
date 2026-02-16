import { BaseEntity } from './base.entity';
import { CloudAccount } from './cloud-account.entity';
import { User } from './user.entity';
export declare class Tenant extends BaseEntity {
    name: string;
    description: string;
    metadata: Record<string, any>;
    cloud_accounts: CloudAccount[];
    users: User[];
}
