// packages/types/src/common.types.ts
export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type ResourceType = 'bucket' | 'container';
export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type FindingStatus = 'open' | 'resolved' | 'suppressed' | 'fixed';

export interface Tenant {
    id: string;
    name: string;
    created_at: Date;
    metadata?: Record<string, any>;
}

export interface CloudAccount {
    id: string;
    tenant_id: string;
    provider: CloudProvider;
    external_id: string;
    name: string;
    credentials: {
        role_arn?: string;
        service_principal_id?: string;
        service_account_key?: string;
    };
    config?: Record<string, any>;
    is_active: boolean;
    last_scanned_at?: Date;
}

export interface StorageResource {
    id: string;
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
    last_modified_at?: Date;
}