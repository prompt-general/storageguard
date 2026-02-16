"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AzureProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureProvider = void 0;
const common_1 = require("@nestjs/common");
const arm_storage_1 = require("@azure/arm-storage");
const storage_blob_1 = require("@azure/storage-blob");
const identity_1 = require("@azure/identity");
let AzureProvider = AzureProvider_1 = class AzureProvider {
    constructor() {
        this.provider = 'azure';
        this.logger = new common_1.Logger(AzureProvider_1.name);
    }
    getCredential(credentials) {
        return new identity_1.ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
    }
    async listResources(credentials) {
        const resources = [];
        const cred = this.getCredential(credentials);
        const storageClient = new arm_storage_1.StorageManagementClient(cred, credentials.subscriptionId);
        try {
            const accounts = [];
            for await (const account of storageClient.storageAccounts.list()) {
                accounts.push(account);
            }
            for (const account of accounts) {
                try {
                    const resourceGroup = this.extractResourceGroup(account.id);
                    const accountName = account.name;
                    const properties = await storageClient.storageAccounts.getProperties(resourceGroup, accountName);
                    let blobProperties;
                    try {
                        blobProperties = await storageClient.blobServices.getServiceProperties(resourceGroup, accountName);
                    }
                    catch (e) {
                        this.logger.warn(`Failed to get blob properties for ${accountName}:`, e);
                        blobProperties = {};
                    }
                    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(`DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${await this.getAccountKey(credentials, resourceGroup, accountName)}`);
                    const containers = [];
                    for await (const container of blobServiceClient.listContainers()) {
                        containers.push(container);
                    }
                    for (const container of containers) {
                        const containerClient = blobServiceClient.getContainerClient(container.name);
                        const containerProperties = await containerClient.getProperties();
                        const publicAccess = containerProperties.blobPublicAccess || 'none';
                        const resource = {
                            id: '',
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
                                logging_enabled: !!blobProperties.logging?.delete || false,
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
                }
                catch (error) {
                    this.logger.error(`Error processing account ${account.name}:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error('Error listing Azure storage resources:', error);
            throw error;
        }
        return resources;
    }
    extractResourceGroup(resourceId) {
        const match = resourceId.match(/resourceGroups\/([^\/]+)/);
        return match ? match[1] : '';
    }
    async getAccountKey(credentials, resourceGroup, accountName) {
        const cred = this.getCredential(credentials);
        const storageClient = new arm_storage_1.StorageManagementClient(cred, credentials.subscriptionId);
        const keys = await storageClient.storageAccounts.listKeys(resourceGroup, accountName);
        return keys.keys[0].value;
    }
    async checkPublicAccess(resource) {
        return {
            failed: resource.configuration.public_access === true,
            details: resource.configuration.policy,
        };
    }
    async checkEncryption(resource) {
        return {
            failed: resource.configuration.encryption_enabled === false,
            details: resource.configuration,
        };
    }
    async checkLogging(resource) {
        return {
            failed: resource.configuration.logging_enabled === false,
            details: resource.configuration,
        };
    }
    async checkVersioning(resource) {
        return {
            failed: resource.configuration.versioning_enabled === false,
            details: { softDeleteEnabled: resource.configuration.versioning_enabled },
        };
    }
    async checkPolicy(resource) {
        const policy = resource.configuration.policy;
        if (!policy)
            return { failed: false };
        const networkAcls = policy.networkAcls;
        if (networkAcls?.defaultAction === 'Allow') {
            return {
                failed: true,
                details: 'Network ACLs default to Allow (should be Deny)',
            };
        }
        if (policy.containersPublicAccess !== 'none') {
            return {
                failed: true,
                details: `Container has public access level: ${policy.containersPublicAccess}`,
            };
        }
        return { failed: false };
    }
    async processEvent(event) {
        return [];
    }
    async removePublicAccess(resourceId, credentials) {
    }
    async enableEncryption(resourceId, credentials) {
    }
    async enableLogging(resourceId, credentials) {
    }
    async enableVersioning(resourceId, credentials) {
    }
    async refreshResource(credentials, resourceId) {
        const [accountName, containerName] = resourceId.split('/');
        const resourceGroup = await this.getResourceGroupForAccount(credentials, accountName);
        if (!resourceGroup)
            return null;
        const cred = this.getCredential(credentials);
        const storageClient = new arm_storage_1.StorageManagementClient(cred, credentials.subscriptionId);
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(`DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${await this.getAccountKey(credentials, resourceGroup, accountName)}`);
        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const containerProperties = await containerClient.getProperties();
            const publicAccess = containerProperties.blobPublicAccess || 'none';
            const properties = await storageClient.storageAccounts.getProperties(resourceGroup, accountName);
            const blobProperties = await storageClient.blobServices.getServiceProperties(resourceGroup, accountName);
            const resource = {
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
                    logging_enabled: !!blobProperties.logging?.delete || false,
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
        }
        catch (error) {
            this.logger.error(`Error refreshing container ${resourceId}:`, error);
            return null;
        }
    }
    async getResourceGroupForAccount(credentials, accountName) {
        const cred = this.getCredential(credentials);
        const storageClient = new arm_storage_1.StorageManagementClient(cred, credentials.subscriptionId);
        let accountId;
        for await (const account of storageClient.storageAccounts.list()) {
            if (account.name === accountName) {
                accountId = account.id;
                break;
            }
        }
        if (!accountId)
            return null;
        return this.extractResourceGroup(accountId);
    }
};
exports.AzureProvider = AzureProvider;
exports.AzureProvider = AzureProvider = AzureProvider_1 = __decorate([
    (0, common_1.Injectable)()
], AzureProvider);
//# sourceMappingURL=azure.provider.js.map