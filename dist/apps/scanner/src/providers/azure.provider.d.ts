import { CloudProviderInterface } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';
export declare class AzureProvider implements CloudProviderInterface {
    readonly provider: CloudProvider;
    private readonly logger;
    private getCredential;
    listResources(credentials: any): Promise<StorageResource[]>;
    private extractResourceGroup;
    private getAccountKey;
    checkPublicAccess(resource: StorageResource): Promise<any>;
    checkEncryption(resource: StorageResource): Promise<any>;
    checkLogging(resource: StorageResource): Promise<any>;
    checkVersioning(resource: StorageResource): Promise<any>;
    checkPolicy(resource: StorageResource): Promise<any>;
    processEvent(event: any): Promise<any[]>;
    removePublicAccess(resourceId: string, credentials: any): Promise<void>;
    enableEncryption(resourceId: string, credentials: any): Promise<void>;
    enableLogging(resourceId: string, credentials: any): Promise<void>;
    enableVersioning(resourceId: string, credentials: any): Promise<void>;
    refreshResource(credentials: any, resourceId: string): Promise<StorageResource | null>;
    private getResourceGroupForAccount;
}
