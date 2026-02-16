"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GcpProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcpProvider = void 0;
const common_1 = require("@nestjs/common");
const storage_1 = require("@google-cloud/storage");
let GcpProvider = GcpProvider_1 = class GcpProvider {
    constructor() {
        this.provider = 'gcp';
        this.logger = new common_1.Logger(GcpProvider_1.name);
    }
    getStorageClient(credentials) {
        return new storage_1.Storage({
            projectId: credentials.projectId,
            credentials: {
                client_email: credentials.clientEmail,
                private_key: credentials.privateKey,
            },
        });
    }
    async listResources(credentials) {
        const resources = [];
        const storage = this.getStorageClient(credentials);
        try {
            const [buckets] = await storage.getBuckets();
            for (const bucket of buckets) {
                try {
                    const [metadata] = await bucket.getMetadata();
                    const [iam] = await bucket.iam.getPolicy();
                    const bucketName = bucket.name;
                    const publicAccess = this.checkPublicAccessFromIam(iam);
                    const encryptionEnabled = !!(metadata.encryption?.defaultKmsKeyName);
                    const versioningEnabled = metadata.versioning?.enabled === true;
                    const loggingEnabled = !!(metadata.logging?.logBucket);
                    const resource = {
                        id: '',
                        tenant_id: '',
                        account_id: '',
                        provider: 'gcp',
                        resource_type: 'bucket',
                        resource_id: bucketName,
                        region: metadata.location || 'us',
                        configuration: {
                            public_access: publicAccess,
                            encryption_enabled: encryptionEnabled,
                            versioning_enabled: versioningEnabled,
                            logging_enabled: loggingEnabled,
                            policy: {
                                iam: iam,
                                labels: metadata.labels || {},
                            },
                            tags: metadata.labels || {},
                        },
                        discovered_at: new Date(),
                        last_modified_at: metadata.updated ? new Date(metadata.updated) : undefined,
                    };
                    resources.push(resource);
                }
                catch (error) {
                    this.logger.error(`Error processing bucket ${bucket.name}:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error('Error listing GCP buckets:', error);
            throw error;
        }
        return resources;
    }
    checkPublicAccessFromIam(iamPolicy) {
        if (!iamPolicy.bindings)
            return false;
        for (const binding of iamPolicy.bindings) {
            if (binding.members && (binding.members.includes('allUsers') ||
                binding.members.includes('allAuthenticatedUsers'))) {
                if (binding.role.includes('storage.objectViewer') ||
                    binding.role.includes('storage.objectCreator') ||
                    binding.role.includes('storage.objectAdmin') ||
                    binding.role.includes('storage.legacyBucketReader') ||
                    binding.role.includes('storage.legacyBucketWriter')) {
                    return true;
                }
            }
        }
        return false;
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
            details: { encryptionEnabled: resource.configuration.encryption_enabled },
        };
    }
    async checkLogging(resource) {
        return {
            failed: resource.configuration.logging_enabled === false,
            details: { loggingEnabled: resource.configuration.logging_enabled },
        };
    }
    async checkVersioning(resource) {
        return {
            failed: resource.configuration.versioning_enabled === false,
            details: { versioningEnabled: resource.configuration.versioning_enabled },
        };
    }
    async checkPolicy(resource) {
        const policy = resource.configuration.policy;
        if (!policy)
            return { failed: false };
        const iam = policy.iam;
        const permissiveBindings = iam?.bindings?.filter(binding => {
            return binding.members?.includes('allUsers') || binding.members?.includes('allAuthenticatedUsers');
        });
        if (permissiveBindings?.length > 0) {
            return {
                failed: true,
                details: {
                    message: 'IAM policy includes public members',
                    permissiveBindings,
                },
            };
        }
        if (resource.configuration.policy?.uniformBucketLevelAccess?.enabled === false) {
            return {
                failed: true,
                details: 'Uniform bucket-level access not enabled, ACLs may allow public access',
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
    async refreshResource(credentials, bucketName) {
        const storage = this.getStorageClient(credentials);
        try {
            const bucket = storage.bucket(bucketName);
            const [metadata] = await bucket.getMetadata();
            const [iam] = await bucket.iam.getPolicy();
            const publicAccess = this.checkPublicAccessFromIam(iam);
            const encryptionEnabled = !!(metadata.encryption?.defaultKmsKeyName);
            const versioningEnabled = metadata.versioning?.enabled === true;
            const loggingEnabled = !!(metadata.logging?.logBucket);
            const resource = {
                id: '',
                tenant_id: '',
                account_id: '',
                provider: 'gcp',
                resource_type: 'bucket',
                resource_id: bucketName,
                region: metadata.location || 'us',
                configuration: {
                    public_access: publicAccess,
                    encryption_enabled: encryptionEnabled,
                    versioning_enabled: versioningEnabled,
                    logging_enabled: loggingEnabled,
                    policy: {
                        iam: iam,
                        labels: metadata.labels || {},
                    },
                    tags: metadata.labels || {},
                },
                discovered_at: new Date(),
                last_modified_at: metadata.updated ? new Date(metadata.updated) : undefined,
            };
            return resource;
        }
        catch (error) {
            this.logger.error(`Error refreshing bucket ${bucketName}:`, error);
            return null;
        }
    }
};
exports.GcpProvider = GcpProvider;
exports.GcpProvider = GcpProvider = GcpProvider_1 = __decorate([
    (0, common_1.Injectable)()
], GcpProvider);
//# sourceMappingURL=gcp.provider.js.map