// apps/scanner/src/providers/gcp.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { CloudProviderInterface } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';

interface GcpCredentials {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

@Injectable()
export class GcpProvider implements CloudProviderInterface {
    readonly provider: CloudProvider = 'gcp';
    private readonly logger = new Logger(GcpProvider.name);

    private getStorageClient(credentials: GcpCredentials): Storage {
        return new Storage({
            projectId: credentials.projectId,
            credentials: {
                client_email: credentials.clientEmail,
                private_key: credentials.privateKey,
            },
        });
    }

    async listResources(credentials: any): Promise<StorageResource[]> {
        const resources: StorageResource[] = [];
        const storage = this.getStorageClient(credentials);

        try {
            // Get all buckets in the project
            const [buckets] = await storage.getBuckets();

            for (const bucket of buckets) {
                try {
                    const [metadata] = await bucket.getMetadata();
                    const [iam] = await bucket.iam.getPolicy();
                    const bucketName = bucket.name;

                    // Determine public access by checking IAM allUsers/allAuthenticatedUsers
                    const publicAccess = this.checkPublicAccessFromIam(iam);

                    // Check encryption
                    const encryptionEnabled = !!(metadata.encryption?.defaultKmsKeyName);

                    // Check versioning (object versioning)
                    const versioningEnabled = metadata.versioning?.enabled === true;

                    // Check logging
                    const loggingEnabled = !!(metadata.logging?.logBucket);

                    const resource: StorageResource = {
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
                } catch (error) {
                    this.logger.error(`Error processing bucket ${bucket.name}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error listing GCP buckets:', error);
            throw error;
        }

        return resources;
    }

    private checkPublicAccessFromIam(iamPolicy: any): boolean {
        if (!iamPolicy.bindings) return false;

        for (const binding of iamPolicy.bindings) {
            // Check for allUsers or allAuthenticatedUsers
            if (binding.members && (
                binding.members.includes('allUsers') ||
                binding.members.includes('allAuthenticatedUsers')
            )) {
                // Check if it's a read or write permission that's too permissive
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
            details: { encryptionEnabled: resource.configuration.encryption_enabled },
        };
    }

    async checkLogging(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.logging_enabled === false,
            details: { loggingEnabled: resource.configuration.logging_enabled },
        };
    }

    async checkVersioning(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.versioning_enabled === false,
            details: { versioningEnabled: resource.configuration.versioning_enabled },
        };
    }

    async checkPolicy(resource: StorageResource): Promise<any> {
        const policy = resource.configuration.policy;
        if (!policy) return { failed: false };

        // Check IAM for overly permissive roles
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

        // Check bucket policy only (uniform bucket-level access) - if ACLs are used, might be public
        // GCP recommends uniform bucket-level access; we can check that too.
        if (resource.configuration.policy?.uniformBucketLevelAccess?.enabled === false) {
            // ACLs could be permissive; we'd need to check ACLs but for MVP we'll flag.
            return {
                failed: true,
                details: 'Uniform bucket-level access not enabled, ACLs may allow public access',
            };
        }

        return { failed: false };
    }

    // Event processing (placeholder)
    async processEvent(event: any): Promise<any[]> {
        // Will implement Cloud Audit Logs processing
        return [];
    }

    // Remediation actions (Phase 2)
    async removePublicAccess(resourceId: string, credentials: any, dryRun: boolean = false): Promise<any> {
        const storage = this.getStorageClient(credentials);
        const bucket = storage.bucket(resourceId);

        const [policy] = await bucket.iam.getPolicy();
        const originalPolicy = JSON.parse(JSON.stringify(policy));

        // Remove all bindings with allUsers or allAuthenticatedUsers
        const filteredBindings = policy.bindings?.filter(binding => {
            return !binding.members?.includes('allUsers') && !binding.members?.includes('allAuthenticatedUsers');
        }) || [];

        if (dryRun) {
            const wouldChange = JSON.stringify(policy.bindings) !== JSON.stringify(filteredBindings);
            return {
                dryRun: true,
                wouldChange,
                currentState: { policy: originalPolicy },
                plannedAction: 'Remove public IAM bindings',
            };
        }

        if (filteredBindings.length !== (policy.bindings?.length || 0)) {
            policy.bindings = filteredBindings;
            await bucket.iam.setPolicy(policy);
        }

        return {
            success: true,
            newState: { policy: filteredBindings },
            rollbackData: { policy: originalPolicy },
        };
    }

    async enableEncryption(resourceId: string, credentials: any, dryRun: boolean = false): Promise<any> {
        const storage = this.getStorageClient(credentials);
        const bucket = storage.bucket(resourceId);

        const [metadata] = await bucket.getMetadata();
        const currentEncryption = metadata.encryption?.defaultKmsKeyName;

        if (dryRun) {
            return {
                dryRun: true,
                wouldChange: !currentEncryption,
                currentState: { encryption: currentEncryption },
                plannedAction: 'Enable default KMS encryption (using Cloud KMS) – requires specifying a KMS key',
            };
        }

        // In production, you'd need a KMS key name. For simplicity, we'll skip.
        return {
            success: false,
            message: 'Encryption remediation requires a KMS key to be specified.',
        };
    }

    async enableLogging(resourceId: string, credentials: any, dryRun: boolean = false): Promise<any> {
        const storage = this.getStorageClient(credentials);
        const bucket = storage.bucket(resourceId);

        const [metadata] = await bucket.getMetadata();
        const currentLogging = metadata.logging?.logBucket;

        if (dryRun) {
            return {
                dryRun: true,
                wouldChange: !currentLogging,
                currentState: { logging: currentLogging },
                plannedAction: 'Enable access logging to a specified bucket',
            };
        }

        // Requires a target bucket. We'll skip.
        return {
            success: false,
            message: 'Logging remediation requires a target log bucket to be specified.',
        };
    }

    async enableVersioning(resourceId: string, credentials: any, dryRun: boolean = false): Promise<any> {
        const storage = this.getStorageClient(credentials);
        const bucket = storage.bucket(resourceId);

        const [metadata] = await bucket.getMetadata();
        const currentVersioning = metadata.versioning?.enabled || false;

        if (dryRun) {
            return {
                dryRun: true,
                wouldChange: !currentVersioning,
                currentState: { versioning: currentVersioning },
                plannedAction: 'Enable object versioning',
            };
        }

        await bucket.setMetadata({ versioning: { enabled: true } });
        return {
            success: true,
            newState: { versioning: true },
            rollbackData: { versioning: currentVersioning },
        };
    }


    async refreshResource(credentials: any, bucketName: string): Promise<StorageResource | null> {
        const storage = this.getStorageClient(credentials);
        try {
            const bucket = storage.bucket(bucketName);
            const [metadata] = await bucket.getMetadata();
            const [iam] = await bucket.iam.getPolicy();

            const publicAccess = this.checkPublicAccessFromIam(iam);
            const encryptionEnabled = !!(metadata.encryption?.defaultKmsKeyName);
            const versioningEnabled = metadata.versioning?.enabled === true;
            const loggingEnabled = !!(metadata.logging?.logBucket);

            const resource: StorageResource = {
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
        } catch (error) {
            this.logger.error(`Error refreshing bucket ${bucketName}:`, error);
            return null;
        }
    }

    async listObjects(credentials: any, bucketName: string, region?: string, limit: number = 100): Promise<any[]> {
        const storage = this.getStorageClient(credentials);
        const bucket = storage.bucket(bucketName);
        const [files] = await bucket.getFiles({ maxResults: limit });
        return files.map(file => ({
            name: file.name,
            size: Number(file.metadata.size),
            lastModified: new Date(file.metadata.updated),
            contentType: file.metadata.contentType,
        }));
    }

    async getObjectMetadata(credentials: any, bucketName: string, objectKey: string): Promise<any> {
        const storage = this.getStorageClient(credentials);
        const file = storage.bucket(bucketName).file(objectKey);
        try {
            const [metadata] = await file.getMetadata();
            return {
                contentType: metadata.contentType,
                contentLength: Number(metadata.size),
                metadata: metadata.metadata,
                lastModified: new Date(metadata.updated),
            };
        } catch (error) {
            this.logger.error(`Error getting metadata for ${objectKey} in ${bucketName}:`, error);
            return null;
        }
    }

    async getObjectContent(credentials: any, bucketName: string, objectKey: string, region?: string, maxBytes?: number): Promise<Buffer> {
        const storage = this.getStorageClient(credentials);
        const file = storage.bucket(bucketName).file(objectKey);
        try {
            const [content] = await file.download({
                start: 0,
                end: maxBytes ? maxBytes - 1 : undefined,
            });
            return content;
        } catch (error) {
            this.logger.error(`Error getting content for ${objectKey} in ${bucketName}:`, error);
            return Buffer.alloc(0);
        }
    }
}



