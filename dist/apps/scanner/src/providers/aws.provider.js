"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AwsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsProvider = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sts_1 = require("@aws-sdk/client-sts");
let AwsProvider = AwsProvider_1 = class AwsProvider {
    constructor() {
        this.provider = 'aws';
        this.logger = new common_1.Logger(AwsProvider_1.name);
    }
    async getClient(credentials, region = 'us-east-1') {
        if (credentials.role_arn) {
            const stsClient = new client_sts_1.STSClient({
                region,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
            const assumeRoleCommand = new client_sts_1.AssumeRoleCommand({
                RoleArn: credentials.role_arn,
                RoleSessionName: 'StorageGuardScanner',
                DurationSeconds: 900,
            });
            const assumedRole = await stsClient.send(assumeRoleCommand);
            return new client_s3_1.S3Client({
                region,
                credentials: {
                    accessKeyId: assumedRole.Credentials.AccessKeyId,
                    secretAccessKey: assumedRole.Credentials.SecretAccessKey,
                    sessionToken: assumedRole.Credentials.SessionToken,
                },
            });
        }
        return new client_s3_1.S3Client({
            region,
            credentials: credentials.access_key_id ? {
                accessKeyId: credentials.access_key_id,
                secretAccessKey: credentials.secret_access_key,
            } : undefined,
        });
    }
    async listResources(credentials) {
        const client = await this.getClient(credentials);
        const resources = [];
        try {
            const listResponse = await client.send(new client_s3_1.ListBucketsCommand({}));
            for (const bucket of listResponse.Buckets || []) {
                try {
                    const bucketName = bucket.Name;
                    const locationResponse = await client.send(new client_s3_1.GetBucketLocationCommand({ Bucket: bucketName }));
                    const region = locationResponse.LocationConstraint || 'us-east-1';
                    const [policy, encryption, logging, versioning, publicAccess] = await Promise.allSettled([
                        this.getBucketPolicy(client, bucketName),
                        this.getBucketEncryption(client, bucketName),
                        this.getBucketLogging(client, bucketName),
                        this.getBucketVersioning(client, bucketName),
                        this.getPublicAccessBlock(client, bucketName),
                    ]);
                    const resource = {
                        id: '',
                        tenant_id: '',
                        account_id: '',
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
                            tags: {},
                        },
                        discovered_at: new Date(),
                        last_modified_at: bucket.CreationDate,
                    };
                    resources.push(resource);
                }
                catch (error) {
                    this.logger.error(`Error processing bucket ${bucket.Name}:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error('Error listing S3 buckets:', error);
            throw error;
        }
        return resources;
    }
    async getBucketPolicy(client, bucketName) {
        try {
            const response = await client.send(new client_s3_1.GetBucketPolicyCommand({ Bucket: bucketName }));
            return response.Policy ? JSON.parse(response.Policy) : null;
        }
        catch (error) {
            if (error.name === 'NoSuchBucketPolicy') {
                return null;
            }
            throw error;
        }
    }
    async getBucketEncryption(client, bucketName) {
        try {
            const response = await client.send(new client_s3_1.GetBucketEncryptionCommand({ Bucket: bucketName }));
            return !!response.ServerSideEncryptionConfiguration;
        }
        catch (error) {
            if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
                return false;
            }
            throw error;
        }
    }
    async getBucketLogging(client, bucketName) {
        try {
            const response = await client.send(new client_s3_1.GetBucketLoggingCommand({ Bucket: bucketName }));
            return !!response.LoggingEnabled;
        }
        catch (error) {
            return false;
        }
    }
    async getBucketVersioning(client, bucketName) {
        try {
            const response = await client.send(new client_s3_1.GetBucketVersioningCommand({ Bucket: bucketName }));
            return response.Status === 'Enabled';
        }
        catch (error) {
            return false;
        }
    }
    async getPublicAccessBlock(client, bucketName) {
        try {
            const response = await client.send(new client_s3_1.GetPublicAccessBlockCommand({ Bucket: bucketName }));
            return response.PublicAccessBlockConfiguration;
        }
        catch (error) {
            return null;
        }
    }
    isPublicAccessBlocked(publicAccess) {
        if (!publicAccess || publicAccess.status !== 'fulfilled') {
            return false;
        }
        const config = publicAccess.value;
        return config && (config.BlockPublicAcls === true ||
            config.BlockPublicPolicy === true ||
            config.IgnorePublicAcls === true ||
            config.RestrictPublicBuckets === true);
    }
    async checkPublicAccess(resource) {
        return {
            failed: resource.configuration.public_access === true,
            details: resource.configuration,
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
            details: resource.configuration,
        };
    }
    async checkPolicy(resource) {
        const policy = resource.configuration.policy;
        if (!policy) {
            return { failed: false, details: 'No policy found' };
        }
        const statements = policy.Statement || [];
        const permissiveStatements = statements.filter((statement) => {
            if (statement.Action === '*' || statement.Action?.includes('*')) {
                return true;
            }
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
    async refreshResource(credentials, bucketName, region) {
        const client = await this.getClient(credentials, region);
        try {
            const [policy, encryption, logging, versioning, publicAccess] = await Promise.allSettled([
                this.getBucketPolicy(client, bucketName),
                this.getBucketEncryption(client, bucketName),
                this.getBucketLogging(client, bucketName),
                this.getBucketVersioning(client, bucketName),
                this.getPublicAccessBlock(client, bucketName),
            ]);
            const resource = {
                id: '',
                tenant_id: '',
                account_id: '',
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
                    tags: {},
                },
                discovered_at: new Date(),
                last_modified_at: new Date(),
            };
            return resource;
        }
        catch (error) {
            this.logger.error(`Error refreshing bucket ${bucketName}:`, error);
            return null;
        }
    }
};
exports.AwsProvider = AwsProvider;
exports.AwsProvider = AwsProvider = AwsProvider_1 = __decorate([
    (0, common_1.Injectable)()
], AwsProvider);
//# sourceMappingURL=aws.provider.js.map