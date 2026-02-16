import { CloudProviderInterface } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';
export declare class AwsProvider implements CloudProviderInterface {
    readonly provider: CloudProvider;
    private readonly logger;
    private getClient;
    listResources(credentials: any): Promise<StorageResource[]>;
    private getBucketPolicy;
    private getBucketEncryption;
    private getBucketLogging;
    private getBucketVersioning;
    private getPublicAccessBlock;
    private isPublicAccessBlocked;
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
    refreshResource(credentials: any, bucketName: string, region: string): Promise<StorageResource | null>;
}
