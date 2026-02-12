// packages/shared/src/providers/provider.interface.ts
import { CloudProvider, StorageResource, Finding } from '@storageguard/types';

export interface CloudProviderInterface {
    provider: CloudProvider;

    // Resource enumeration
    listResources(credentials: any, region?: string): Promise<StorageResource[]>;

    // Configuration checks
    checkPublicAccess(resource: StorageResource): Promise<boolean>;
    checkEncryption(resource: StorageResource): Promise<boolean>;
    checkLogging(resource: StorageResource): Promise<boolean>;
    checkVersioning(resource: StorageResource): Promise<boolean>;
    checkPolicy(resource: StorageResource): Promise<any>;

    // Event handling
    processEvent(event: any): Promise<Partial<Finding>[]>;

    // Remediation actions
    removePublicAccess(resourceId: string, credentials: any): Promise<void>;
    enableEncryption(resourceId: string, credentials: any): Promise<void>;
    enableLogging(resourceId: string, credentials: any): Promise<void>;
    enableVersioning(resourceId: string, credentials: any): Promise<void>;
}