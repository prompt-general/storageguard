// apps/scanner/src/providers/aws.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import {
    S3Client,
    ListBucketsCommand,
    GetBucketPolicyCommand,
    GetBucketEncryptionCommand,
    GetBucketLoggingCommand,
    GetBucketVersioningCommand,
    GetPublicAccessBlockCommand,
    GetBucketLocationCommand
} from '@aws-sdk/client-s3';
import { CloudProviderInterface } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

@Injectable()
export class AwsProvider implements CloudProviderInterface {
    readonly provider: CloudProvider = 'aws';
    private readonly logger = new Logger(AwsProvider.name);

    private async getClient(credentials: any, region: string = 'us-east-1'): Promise<S3Client> {
        if (credentials.role_arn) {
            // Assume role for cross-account access
            const stsClient = new STSClient({
                region,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });

            const assumeRoleCommand = new AssumeRoleCommand({
                RoleArn: credentials.role_arn,
                RoleSessionName: 'StorageGuardScanner',
                DurationSeconds: 900,
            });

            const assumedRole = await stsClient.send(assumeRoleCommand);

            return new S3Client({
                region,
                credentials: {
                    accessKeyId: assumedRole.Credentials.AccessKeyId,
                    secretAccessKey: assumedRole.Credentials.SecretAccessKey,
                    sessionToken: assumedRole.Credentials.SessionToken,
                },
            });
        }

        // Use provided credentials directly (for testing)
        return new S3Client({
            region,
            credentials: credentials.access_key_id ? {
                accessKeyId: credentials.access_key_id,
                secretAccessKey: credentials.secret_access_key,
            } : undefined,
        });
    }

    async listResources(credentials: any): Promise<StorageResource[]> {
        const client = await this.getClient(credentials);
        const resources: StorageResource[] = [];

        try {
            const listResponse = await client.send(new ListBucketsCommand({}));

            for (const bucket of listResponse.Buckets || []) {
                try {
                    const bucketName = bucket.Name;

                    // Get bucket location (region)
                    const locationResponse = await client.send(
                        new GetBucketLocationCommand({ Bucket: bucketName })
                    );
                    const region = locationResponse.LocationConstraint || 'us-east-1';

                    // Get bucket configuration
                    const [policy, encryption, logging, versioning, publicAccess] = await Promise.allSettled([
                        this.getBucketPolicy(client, bucketName),
                        this.getBucketEncryption(client, bucketName),
                        this.getBucketLogging(client, bucketName),
                        this.getBucketVersioning(client, bucketName),
                        this.getPublicAccessBlock(client, bucketName),
                    ]);

                    const resource: StorageResource = {
                        id: '', // Will be set by database
                        tenant_id: '', // Will be set by scanner
                        account_id: '', // Will be set by scanner
                        provider: 'aws',
                        resource_type: 'bucket',
                        resource_id: bucketName,
                        region,
                        configuration: {
                            public_access: this.isPublicAccessBlocked(publicAccess) ? false : true,
                            encryption_enabled: encryption.status === 'fulfilled' && encryption.value,
                            versioning_enabled: versioning.status === 'fulfilled' && versioning.value,
                            logging_enabled: logging.status === 'fulfilled' && logging.value,
                            policy: policy.status === 'fulfilled' ? policy.value : null,
                            tags: {}, // Would fetch bucket tags
                        },
                        discovered_at: new Date(),
                        last_modified_at: bucket.CreationDate,
                    };

                    resources.push(resource);
                } catch (error) {
                    this.logger.error(`Error processing bucket ${bucket.Name}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error listing S3 buckets:', error);
            throw error;
        }

        return resources;
    }

    private async getBucketPolicy(client: S3Client, bucketName: string): Promise<any> {
        try {
            const response = await client.send(
                new GetBucketPolicyCommand({ Bucket: bucketName })
            );
            return response.Policy ? JSON.parse(response.Policy) : null;
        } catch (error) {
            if (error.name === 'NoSuchBucketPolicy') {
                return null;
            }
            throw error;
        }
    }

    private async getBucketEncryption(client: S3Client, bucketName: string): Promise<boolean> {
        try {
            const response = await client.send(
                new GetBucketEncryptionCommand({ Bucket: bucketName })
            );
            return !!response.ServerSideEncryptionConfiguration;
        } catch (error) {
            if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
                return false;
            }
            throw error;
        }
    }

    private async getBucketLogging(client: S3Client, bucketName: string): Promise<boolean> {
        try {
            const response = await client.send(
                new GetBucketLoggingCommand({ Bucket: bucketName })
            );
            return !!response.LoggingEnabled;
        } catch (error) {
            return false;
        }
    }

    private async getBucketVersioning(client: S3Client, bucketName: string): Promise<boolean> {
        try {
            const response = await client.send(
                new GetBucketVersioningCommand({ Bucket: bucketName })
            );
            return response.Status === 'Enabled';
        } catch (error) {
            return false;
        }
    }

    private async getPublicAccessBlock(client: S3Client, bucketName: string): Promise<any> {
        try {
            const response = await client.send(
                new GetPublicAccessBlockCommand({ Bucket: bucketName })
            );
            return response.PublicAccessBlockConfiguration;
        } catch (error) {
            return null;
        }
    }

    private isPublicAccessBlocked(publicAccess: any): boolean {
        if (!publicAccess || publicAccess.status !== 'fulfilled') {
            return false;
        }

        const config = publicAccess.value;
        return config && (
            config.BlockPublicAcls === true ||
            config.BlockPublicPolicy === true ||
            config.IgnorePublicAcls === true ||
            config.RestrictPublicBuckets === true
        );
    }

    // Security check implementations
    async checkPublicAccess(resource: StorageResource): Promise<any> {
        return {
            failed: resource.configuration.public_access === true,
            details: resource.configuration,
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
        return {
            failed: resource.configuration.versioning_enabled === false,
            details: resource.configuration,
        };
    }

    async checkPolicy(resource: StorageResource): Promise<any> {
        const policy = resource.configuration.policy;
        if (!policy) {
            return { failed: false, details: 'No policy found' };
        }

        // Check for overly permissive statements
        const statements = policy.Statement || [];
        const permissiveStatements = statements.filter((statement: any) => {
            // Check for wildcard actions
            if (statement.Action === '*' || statement.Action?.includes('*')) {
                return true;
            }
            // Check for wildcard principals
            if (statement.Principal === '*' || statement.Principal?.AWS === '*') {
                return true;
            }
            return false;
        });

        return {
            failed: permissiveStatements.length > 0,
            details: {
                policy,
                permissiveStatements,
            },
        };
    }

    // Event processing (Phase 1 - placeholder)
    async processEvent(event: any): Promise<any[]> {
        // Will implement CloudTrail event processing
        return [];
    }

    // Remediation actions (Phase 2)
    async removePublicAccess(resourceId: string, credentials: any): Promise<void> {
        // Implementation for Phase 2
    }

    async enableEncryption(resourceId: string, credentials: any): Promise<void> {
        // Implementation for Phase 2
    }

    async enableLogging(resourceId: string, credentials: any): Promise<void> {
        // Implementation for Phase 2
    }

    async enableVersioning(resourceId: string, credentials: any): Promise<void> {
        // Implementation for Phase 2
    }
}