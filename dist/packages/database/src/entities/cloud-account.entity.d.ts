import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { StorageResource } from './storage-resource.entity';
export declare enum CloudProvider {
    AWS = "aws",
    AZURE = "azure",
    GCP = "gcp"
}
export declare class CloudAccount extends BaseEntity {
    tenant_id: string;
    provider: CloudProvider;
    external_id: string;
    name: string;
    credentials: {
        role_arn?: string;
        service_principal_id?: string;
        service_account_key?: string;
    };
    config: Record<string, any>;
    is_active: boolean;
    last_scanned_at: Date;
    tenant: Tenant;
    storage_resources: StorageResource[];
}
