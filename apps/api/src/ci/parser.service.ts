import { Injectable } from '@nestjs/common';
import * as hcl from 'hcl2-parser';
import * as yaml from 'js-yaml';
import { CloudProvider, StorageResource, ResourceType } from '@storageguard/types';

@Injectable()
export class ParserService {
    parse(content: string, fileType: 'tf' | 'tf.json' | 'yaml' | 'json', provider: CloudProvider): StorageResource[] {
        let parsed: any;
        if (fileType === 'tf') {
            parsed = hcl.parse(content);
        } else if (fileType === 'tf.json' || fileType === 'json') {
            parsed = JSON.parse(content);
        } else if (fileType === 'yaml') {
            parsed = yaml.load(content);
        } else {
            throw new Error('Unsupported file type');
        }

        return this.extractResources(parsed, provider);
    }

    private extractResources(parsed: any, provider: CloudProvider): StorageResource[] {
        const resources: StorageResource[] = [];

        if (provider === 'aws') {
            this.extractAwsResources(parsed, resources);
        } else if (provider === 'azure') {
            this.extractAzureResources(parsed, resources);
        } else if (provider === 'gcp') {
            this.extractGcpResources(parsed, resources);
        }

        return resources;
    }

    private extractAwsResources(parsed: any, resources: StorageResource[]) {
        // Terraform AWS
        if (parsed.resource?.aws_s3_bucket) {
            const buckets = parsed.resource.aws_s3_bucket;
            for (const name in buckets) {
                const config = buckets[name];
                resources.push(this.mapTerraformS3Bucket(name, config));
            }
        }

        // CloudFormation AWS
        if (parsed.Resources) {
            for (const key in parsed.Resources) {
                const resource = parsed.Resources[key];
                if (resource.Type === 'AWS::S3::Bucket') {
                    resources.push(this.mapCfnS3Bucket(key, resource.Properties || {}));
                }
            }
        }
    }

    private mapTerraformS3Bucket(name: string, config: any): StorageResource {
        // Simplified mapping
        return {
            id: '',
            tenant_id: '',
            account_id: '',
            provider: 'aws',
            resource_type: 'bucket' as ResourceType,
            resource_id: config.bucket || name,
            region: config.region || 'us-east-1',
            configuration: {
                public_access: config.acl === 'public-read' || config.acl === 'public-read-write',
                encryption_enabled: !!config.server_side_encryption_configuration,
                versioning_enabled: config.versioning?.enabled === true || config.versioning?.[0]?.enabled === true,
                logging_enabled: !!config.logging,
                policy: config.policy ? (typeof config.policy === 'string' ? JSON.parse(config.policy) : config.policy) : {},
                tags: config.tags || {},
            },
            discovered_at: new Date(),
        };
    }

    private mapCfnS3Bucket(name: string, props: any): StorageResource {
        return {
            id: '',
            tenant_id: '',
            account_id: '',
            provider: 'aws',
            resource_type: 'bucket' as ResourceType,
            resource_id: props.BucketName || name,
            region: 'us-east-1', // Default
            configuration: {
                public_access: props.AccessControl === 'PublicRead' || props.AccessControl === 'PublicReadWrite',
                encryption_enabled: !!props.BucketEncryption,
                versioning_enabled: props.VersioningConfiguration?.Status === 'Enabled',
                logging_enabled: !!props.LoggingConfiguration,
                policy: props.BucketPolicy || {},
                tags: (props.Tags || []).reduce((acc: any, tag: any) => ({ ...acc, [tag.Key]: tag.Value }), {}),
            },
            discovered_at: new Date(),
        };
    }

    private extractAzureResources(parsed: any, resources: StorageResource[]) {
        if (parsed.resource?.azurerm_storage_account) {
            const accounts = parsed.resource.azurerm_storage_account;
            for (const name in accounts) {
                const config = accounts[name];
                resources.push({
                    id: '',
                    tenant_id: '',
                    account_id: '',
                    provider: 'azure',
                    resource_type: 'bucket' as ResourceType, // Azure uses accounts/containers
                    resource_id: config.name || name,
                    region: config.location || 'eastus',
                    configuration: {
                        public_access: config.allow_blob_public_access === true,
                        encryption_enabled: true, // Always on in Azure
                        versioning_enabled: config.blob_properties?.versioning_enabled === true,
                        logging_enabled: !!config.queue_properties?.logging,
                        policy: {},
                        tags: config.tags || {},
                    },
                    discovered_at: new Date(),
                });
            }
        }
    }

    private extractGcpResources(parsed: any, resources: StorageResource[]) {
        if (parsed.resource?.google_storage_bucket) {
            const buckets = parsed.resource.google_storage_bucket;
            for (const name in buckets) {
                const config = buckets[name];
                resources.push({
                    id: '',
                    tenant_id: '',
                    account_id: '',
                    provider: 'gcp',
                    resource_type: 'bucket' as ResourceType,
                    resource_id: config.name || name,
                    region: config.location || 'US',
                    configuration: {
                        public_access: false, // GCP is default private
                        encryption_enabled: !!config.encryption,
                        versioning_enabled: config.versioning?.enabled === true,
                        logging_enabled: !!config.logging,
                        policy: {},
                        tags: config.labels || {},
                    },
                    discovered_at: new Date(),
                });
            }
        }
    }
}
