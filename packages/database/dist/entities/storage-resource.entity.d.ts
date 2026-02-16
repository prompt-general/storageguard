import { BaseEntity } from './base.entity';
import { CloudAccount, CloudProvider } from './cloud-account.entity';
import { Finding } from './finding.entity';
export declare enum ResourceType {
    BUCKET = "bucket",
    CONTAINER = "container"
}
export declare class StorageResource extends BaseEntity {
    tenant_id: string;
    account_id: string;
    provider: CloudProvider;
    resource_type: ResourceType;
    resource_id: string;
    region: string;
    configuration: {
        public_access: boolean;
        encryption_enabled: boolean;
        versioning_enabled: boolean;
        logging_enabled: boolean;
        policy: Record<string, any>;
        tags: Record<string, string>;
    };
    discovered_at: Date;
    last_modified_at: Date;
    cloud_account: CloudAccount;
    findings: Finding[];
}
