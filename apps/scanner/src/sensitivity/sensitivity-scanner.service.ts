import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageResource, CloudAccount } from '@storageguard/database';
import { AwsProvider } from '../providers/aws.provider';
import { AzureProvider } from '../providers/azure.provider';
import { GcpProvider } from '../providers/gcp.provider';

interface SensitiveDataPattern {
    name: string;
    type: string; // 'pii', 'credential', 'financial', etc.
    regex: RegExp;
    minLength?: number;
    maxLength?: number;
    fileExtensions?: string[]; // If present, only scan files with these extensions
    contentTypes?: string[]; // If present, only scan objects with these content types
}

@Injectable()
export class SensitivityScannerService {
    private readonly logger = new Logger(SensitivityScannerService.name);
    private patterns: SensitiveDataPattern[] = [
        // PII
        {
            name: 'SSN',
            type: 'pii',
            regex: /\b(?!000|666|9\d{2})([0-8]\d{2}|7([0-6]\d))([-]?)(?!00)\d\d\3(?!0000)\d{4}\b/,
            minLength: 11,
            maxLength: 11,
        },
        {
            name: 'Email',
            type: 'pii',
            regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
        },
        {
            name: 'CreditCard',
            type: 'financial',
            regex: /\b(?:\d[ -]*?){13,16}\b/,
            minLength: 13,
            maxLength: 19,
        },
        // Credentials
        {
            name: 'AWS_Access_Key',
            type: 'credential',
            regex: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,
            fileExtensions: ['.txt', '.log', '.json', '.yml', '.yaml', '.env', '.conf', '.config'],
        },
        {
            name: 'AWS_Secret_Key',
            type: 'credential',
            regex: /\b(?![A-Za-z0-9/+=]{40})[A-Za-z0-9/+=]{40}\b/,
            fileExtensions: ['.txt', '.log', '.json', '.yml', '.yaml', '.env', '.conf', '.config'],
        },
        {
            name: 'Private_Key',
            type: 'credential',
            regex: /-----BEGIN (RSA|EC|DSA) PRIVATE KEY-----/,
            fileExtensions: ['.pem', '.key', '.ppk'],
        },
        {
            name: 'Password_in_URL',
            type: 'credential',
            regex: /https?:\/\/[^:]+:[^@]+@/,
        },
        // Additional patterns can be added
    ];

    constructor(
        @InjectRepository(StorageResource)
        private resourceRepository: Repository<StorageResource>,
        @InjectRepository(CloudAccount)
        private accountRepository: Repository<CloudAccount>,
        private awsProvider: AwsProvider,
        private azureProvider: AzureProvider,
        private gcpProvider: GcpProvider,
    ) { }

    async scanResource(resourceId: string, tenantId: string): Promise<any> {
        const resource = await this.resourceRepository.findOne({
            where: { id: resourceId, tenant_id: tenantId },
        });
        if (!resource) throw new Error('Resource not found');

        // Mark as in progress
        await this.resourceRepository.update(resourceId, {
            sensitivity: {
                scan_status: 'in_progress',
                scanned_at: new Date(),
                has_sensitive_data: false,
                sensitive_data_types: [],
                sensitive_object_count: 0,
                total_objects_scanned: 0,
            },
        });

        try {
            const account = await this.accountRepository.findOne({
                where: { id: resource.account_id, tenant_id: tenantId },
            });
            if (!account) throw new Error('Cloud account not found');

            // Select provider
            let provider: any;
            if (account.provider === 'aws') provider = this.awsProvider;
            else if (account.provider === 'azure') provider = this.azureProvider;
            else if (account.provider === 'gcp') provider = this.gcpProvider;
            else throw new Error('Unsupported provider');

            // List objects in the resource (limit to 100 for performance)
            const objects = await provider.listObjects(
                account.credentials,
                resource.resource_id,
                resource.region,
                100, // limit
            );

            const sensitiveTypes = new Set<string>();
            let sensitiveCount = 0;
            let scannedCount = 0;

            // For each object, sample content if possible
            for (const obj of objects) {
                scannedCount++;
                const objectSensitiveTypes = await this.scanObject(provider, account.credentials, resource, obj);
                if (objectSensitiveTypes.length > 0) {
                    sensitiveCount++;
                    objectSensitiveTypes.forEach(t => sensitiveTypes.add(t));
                }
                // Avoid excessive API calls; we can add a small delay
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Update resource with results
            const sensitivityResult = {
                scan_status: 'completed',
                scanned_at: new Date(),
                has_sensitive_data: sensitiveCount > 0,
                sensitive_data_types: Array.from(sensitiveTypes),
                sensitive_object_count: sensitiveCount,
                total_objects_scanned: scannedCount,
            };

            await this.resourceRepository.update(resourceId, { sensitivity: sensitivityResult });

            return sensitivityResult;
        } catch (error) {
            this.logger.error(`Sensitivity scan failed for resource ${resourceId}:`, error);
            await this.resourceRepository.update(resourceId, {
                sensitivity: {
                    scan_status: 'failed',
                    scan_error: error.message,
                    scanned_at: new Date(),
                },
            });
            throw error;
        }
    }

    private async scanObject(provider: any, credentials: any, resource: StorageResource, object: any): Promise<string[]> {
        const sensitiveTypes: string[] = [];
        const objectKey = object.key || object.name || object.Key;

        // Check file extension first for efficiency
        const ext = this.getFileExtension(objectKey);
        const applicablePatterns = this.patterns.filter(p => {
            if (p.fileExtensions && p.fileExtensions.length > 0) {
                return p.fileExtensions.includes(ext);
            }
            return true; // no extension restriction
        });
        if (applicablePatterns.length === 0) return [];

        // Get object metadata (size, content-type)
        const metadata = await provider.getObjectMetadata(credentials, resource.resource_id, objectKey, resource.region);
        if (!metadata) return [];

        // Optionally filter by content-type
        const contentType = metadata.contentType || '';
        const patternsByType = applicablePatterns.filter(p => {
            if (p.contentTypes && p.contentTypes.length > 0) {
                return p.contentTypes.some(ct => contentType.includes(ct));
            }
            return true;
        });
        if (patternsByType.length === 0) return [];

        // Sample content: read first 8KB (or based on object size)
        const maxSampleSize = 8 * 1024; // 8 KB
        const content = await provider.getObjectContent(
            credentials,
            resource.resource_id,
            objectKey,
            resource.region,
            maxSampleSize
        );
        if (!content || content.length === 0) return [];

        // Convert to string (assuming text; for binary we'd need different handling)
        const textContent = content.toString('utf-8');

        // Run regex patterns
        for (const pattern of patternsByType) {
            if (pattern.regex.test(textContent)) {
                sensitiveTypes.push(pattern.type);
            }
        }

        return sensitiveTypes;
    }

    private getFileExtension(filename: string): string {
        const idx = filename.lastIndexOf('.');
        return idx === -1 ? '' : filename.substring(idx).toLowerCase();
    }
}
