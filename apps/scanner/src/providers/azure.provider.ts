// apps/scanner/src/providers/azure.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import {
    StorageManagementClient,
    StorageAccountsGetPropertiesResponse,
    BlobServiceProperties,
} from '@azure/arm-storage';
import { BlobServiceClient, ContainerItem } from '@azure/storage-blob';
import { ClientSecretCredential } from '@azure/identity';
import { CloudProviderInterface } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';

interface AzureCredentials {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    subscriptionId: string;
}

@Injectable()
export class AzureProvider implements CloudProviderInterface {
    readonly provider: CloudProvider = 'azure';
    private readonly logger = new Logger(AzureProvider.name);

    private getCredential(credentials: AzureCredentials): ClientSecretCredential {
        return new ClientSecretCredential(
            credentials.tenantId,
            credentials.clientId,
            credentials.clientSecret
        );
    }

    async listResources(credentials: any): Promise<StorageResource[]> {
        const resources: StorageResource[] = [];
        const cred = this.getCredential(credentials);
        const storageClient = new StorageManagementClient(cred, credentials.subscriptionId);

        try {
            // List all storage accounts in the subscription
            const accounts = [];
            for await (const account of storageClient.storageAccounts.list()) {
                accounts.push(account);
            }

            for (const account of accounts) {
                try {
                    const resourceGroup = this.extractResourceGroup(account.id);
                    const accountName = account.name;

                    // Get account properties for region and other details
                    const properties = await storageClient.storageAccounts.getProperties(
                        resourceGroup,
                        accountName
                    );

                    // Get blob service properties for logging, encryption, etc.
                    let blobProperties: BlobServiceProperties;
                    try {
                        blobProperties = await storageClient.blobServices.getServiceProperties(
                            resourceGroup,
                            accountName
                        );
                    } catch (e) {
                        this.logger.warn(`Failed to get blob properties for ${accountName}:`, e);
                        blobProperties = {};
                    }

                    // Get containers
                    const blobServiceClient = BlobServiceClient.fromConnectionString(
                        `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${await this.getAccountKey(credentials, resourceGroup, accountName)}`
                    );
                    const containers: ContainerItem[] = [];
                    for await (const container of blobServiceClient.listContainers()) {
                        containers.push(container);
                    }

                    // Convert each container to our StorageResource model
                    for (const container of containers) {
                        // Get container properties
                        const containerClient = blobServiceClient.getContainerClient(container.name);
                        const containerProperties = await containerClient.getProperties();

                        // Determine if container is public
                        const publicAccess = containerProperties.blobPublicAccess || 'none';

                        const resource: StorageResource = {
                            id: '', // filled later
                            tenant_id: '',
                            account_id: '',
                            provider: 'azure',
                            resource_type: 'container',
                            resource_id: `${accountName}/${container.name}`,
                            region: properties.primaryLocation || 'unknown',
                            configuration: {
                                public_access: publicAccess !== 'none',
                                encryption_enabled: properties.encryption?.services?.blob?.enabled || false,
                                versioning_enabled: blobProperties?.containerDeleteRetentionPolicy?.enabled || false,
                                logging_enabled: !!(blobProperties as any).logging?.delete || false,

                                policy: {
                                    containersPublicAccess: publicAccess,
                                    networkAcls: properties.networkRuleSet,
                                },
                                tags: account.tags || {},
                            },
                            discovered_at: new Date(),
                            last_modified_at: containerProperties.lastModified,
                        };
                        resources.push(resource);
                    }
                } catch (error) {
                    this.logger.error(`Error processing account ${account.name}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error listing Azure storage resources:', error);
            throw error;
        }

        return resources;
    }

    private extractResourceGroup(resourceId: string): string {
        // resourceId format: /subscriptions/{sub}/resourceGroups/{rg}/providers/...
        const match = resourceId.match(/resourceGroups\/([^\/]+)/);
        return match ? match[1] : '';
    }

    private async getAccountKey(
        credentials: AzureCredentials,
        resourceGroup: string,
        accountName: string
    ): Promise<string> {
        const cred = this.getCredential(credentials);
        const storageClient = new StorageManagementClient(cred, credentials.subscriptionId);
        const keys = await storageClient.storageAccounts.listKeys(resourceGroup, accountName);
        return keys.keys[0].value;
    }

    // Security checks
    async checkPublicAccess(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.public_access === true,
            details: resource.configuration.policy,
        };
    }

    async checkEncryption(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.encryption_enabled === false,
            details: resource.configuration,
        };
    }

    async checkLogging(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.logging_enabled === false,
            details: resource.configuration,
        };
    }

    async checkVersioning(resource: StorageResource): Promise<any> {
        // Azure uses soft delete for containers
        return {
            failed: resource.configuration.versioning_enabled === false,
            details: { softDeleteEnabled: resource.configuration.versioning_enabled },
        };
    }

    async checkPolicy(resource: StorageResource): Promise<any> {
        const policy = resource.configuration.policy;
        if (!policy) return { failed: false };

        // Check network ACLs for overly permissive rules
        const networkAcls = policy.networkAcls;
        if (networkAcls?.defaultAction === 'Allow') {
            return {
                failed: true,
                details: 'Network ACLs default to Allow (should be Deny)',
            };
        }

        // Check for public containers
        if (policy.containersPublicAccess !== 'none') {
            return {
                failed: true,
                details: `Container has public access level: ${policy.containersPublicAccess}`,
            };
        }

        return { failed: false };
    }

    // Event processing (placeholder)
    async processEvent(event: any): Promise<any[]> {
        // Will implement Azure Activity Logs processing
        return [];
    }

    // Remediation actions (Phase 2)
    async removePublicAccess(resourceId: string, credentials: any): Promise<void> {
        // TODO
    }

    async enableEncryption(resourceId: string, credentials: any): Promise<void> {
        // TODO
    }

    async enableLogging(resourceId: string, credentials: any): Promise<void> {
        // TODO
    }

    async enableVersioning(resourceId: string, credentials: any): Promise<void> {
        // TODO
    }

    async refreshResource(credentials: any, resourceId: string): Promise<StorageResource | null> {
        // resourceId format: "accountName/containerName"
        const [accountName, containerName] = resourceId.split('/');
        const resourceGroup = await this.getResourceGroupForAccount(credentials, accountName);
        if (!resourceGroup) return null;

        const cred = this.getCredential(credentials);
        const storageClient = new StorageManagementClient(cred, credentials.subscriptionId);
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${await this.getAccountKey(credentials, resourceGroup, accountName)}`
        );

        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const containerProperties = await containerClient.getProperties();
            const publicAccess = containerProperties.blobPublicAccess || 'none';

            // Get account properties
            const properties = await storageClient.storageAccounts.getProperties(resourceGroup, accountName);
            const blobProperties = await storageClient.blobServices.getServiceProperties(resourceGroup, accountName);

            const resource: StorageResource = {
                id: '',
                tenant_id: '',
                account_id: '',
                provider: 'azure',
                resource_type: 'container',
                resource_id: resourceId,
                region: properties.primaryLocation || 'unknown',
                configuration: {
                    public_access: publicAccess !== 'none',
                    encryption_enabled: properties.encryption?.services?.blob?.enabled || false,
                    versioning_enabled: blobProperties?.containerDeleteRetentionPolicy?.enabled || false,
                    logging_enabled: !!(blobProperties as any).logging?.delete || false,
                    policy: {
                        containersPublicAccess: publicAccess,
                        networkAcls: properties.networkRuleSet,
                    },
                    tags: properties.tags || {},
                },
                discovered_at: new Date(),
                last_modified_at: containerProperties.lastModified,
            };
            return resource;
        } catch (error) {
            this.logger.error(`Error refreshing container ${resourceId}:`, error);
            return null;
        }
    }

    private async getResourceGroupForAccount(credentials: any, accountName: string): Promise<string | null> {
        const cred = this.getCredential(credentials);
        const storageClient = new StorageManagementClient(cred, credentials.subscriptionId);
        let accountId: string | undefined;

        for await (const account of storageClient.storageAccounts.list()) {
            if (account.name === accountName) {
                accountId = account.id;
                break;
            }
        }

        if (!accountId) return null;
        return this.extractResourceGroup(accountId);
    }
}

