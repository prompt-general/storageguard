// apps/scanner/src/events/event-processor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudAccount, StorageResource, Finding } from '@storageguard/database';
import { AwsProvider } from '../providers/aws.provider';
import { FindingsService } from '../../../api/src/findings/findings.service'; // Ideally move to shared
import { ControlService } from '../../../api/src/control/control.service';
import { RiskScoringEngine } from '@storageguard/shared';
import { CloudTrailEvent, NormalizedEvent } from './event.types';

@Injectable()
export class EventProcessorService {
    private readonly logger = new Logger(EventProcessorService.name);
    private riskEngine = new RiskScoringEngine();

    constructor(
        @InjectRepository(CloudAccount)
        private cloudAccountRepository: Repository<CloudAccount>,
        @InjectRepository(StorageResource)
        private storageResourceRepository: Repository<StorageResource>,
        private awsProvider: AwsProvider,
        private findingsService: FindingsService,
        private controlService: ControlService,
    ) { }

    async processEvent(rawEvent: any) {
        try {
            // Normalize based on source
            if (rawEvent.source === 'aws.s3') {
                await this.processAwsEvent(rawEvent);
            } else if (rawEvent.source.includes('azure')) {
                // TODO: Azure event processing
            } else if (rawEvent.source.includes('google')) {
                // TODO: GCP event processing
            } else {
                this.logger.warn(`Unsupported event source: ${rawEvent.source}`);
            }
        } catch (error) {
            this.logger.error('Failed to process event', error);
        }
    }

    private async processAwsEvent(rawEvent: CloudTrailEvent) {
        const eventName = rawEvent.detail.eventName;
        const bucketName = this.extractBucketFromArn(rawEvent.resources?.[0]?.ARN);
        if (!bucketName) {
            this.logger.debug('Event does not involve a bucket, ignoring');
            return;
        }

        const accountId = rawEvent.account;
        const region = rawEvent.region;

        // Find the cloud account that owns this bucket
        const cloudAccount = await this.cloudAccountRepository.findOne({
            where: {
                provider: 'aws',
                external_id: accountId,
                is_active: true,
            },
        });

        if (!cloudAccount) {
            this.logger.warn(`No active cloud account found for AWS account ${accountId}`);
            return;
        }

        // Find or fetch the storage resource
        let storageResource = await this.storageResourceRepository.findOne({
            where: {
                tenant_id: cloudAccount.tenant_id,
                provider: 'aws',
                resource_id: bucketName,
            },
        });

        // If resource not in DB, trigger a full scan of this bucket
        if (!storageResource) {
            this.logger.log(`Bucket ${bucketName} not in DB, scanning now`);
            const resources = await this.awsProvider.listResources(cloudAccount.credentials, region);
            const matched = resources.find(r => r.resource_id === bucketName);
            if (matched) {
                storageResource = await this.saveResource(cloudAccount, matched);
            } else {
                this.logger.warn(`Bucket ${bucketName} not found in provider scan`);
                return;
            }
        }

        // Determine which security checks to run based on event name
        const changedProperties = this.mapEventToProperties(eventName);
        if (changedProperties.length === 0) {
            this.logger.debug(`Event ${eventName} does not trigger security checks`);
            return;
        }

        // Re-run relevant checks on this bucket
        await this.runSecurityChecks(cloudAccount, storageResource, changedProperties);
    }

    private extractBucketFromArn(arn?: string): string | null {
        if (!arn) return null;
        // ARN format: arn:aws:s3:::bucket-name
        const parts = arn.split(':');
        if (parts.length >= 6 && parts[2] === 's3') {
            return parts[5];
        }
        return null;
    }

    private mapEventToProperties(eventName: string): string[] {
        // Map CloudTrail event names to the configuration properties they affect
        const mapping = {
            'PutBucketPolicy': ['policy'],
            'DeleteBucketPolicy': ['policy'],
            'PutBucketAcl': ['public_access'],
            'PutBucketPublicAccessBlock': ['public_access'],
            'PutBucketEncryption': ['encryption'],
            'DeleteBucketEncryption': ['encryption'],
            'PutBucketLogging': ['logging'],
            'PutBucketVersioning': ['versioning'],
            'PutBucketLifecycle': ['versioning'], // if lifecycle involves versioning?
        };
        return mapping[eventName] || [];
    }

    private async runSecurityChecks(
        cloudAccount: CloudAccount,
        resource: StorageResource,
        changedProperties: string[],
    ) {
        // Re-fetch the resource's current configuration from the provider
        const refreshedResource = await this.awsProvider.refreshResource(
            cloudAccount.credentials,
            resource.resource_id,
            resource.region,
        );

        if (!refreshedResource) {
            this.logger.error(`Failed to refresh resource ${resource.resource_id}`);
            return;
        }

        // Update DB with latest config
        await this.storageResourceRepository.update(resource.id, {
            configuration: refreshedResource.configuration,
            last_modified_at: new Date(),
        });

        // Determine which checks to run based on changed properties
        const checksToRun = [];
        if (changedProperties.includes('public_access') || changedProperties.includes('policy')) {
            checksToRun.push('checkPublicAccess', 'checkPolicy');
        }
        if (changedProperties.includes('encryption')) {
            checksToRun.push('checkEncryption');
        }
        if (changedProperties.includes('logging')) {
            checksToRun.push('checkLogging');
        }
        if (changedProperties.includes('versioning')) {
            checksToRun.push('checkVersioning');
        }

        // Run checks (similar to scanner service)
        for (const checkName of checksToRun) {
            const checkMethod = this.awsProvider[checkName];
            if (!checkMethod) continue;

            const checkResult = await checkMethod.call(this.awsProvider, refreshedResource);
            if (checkResult.failed) {
                await this.createOrUpdateFinding(resource, checkName, checkResult);
            } else {
                // If there was an open finding for this check, resolve it
                await this.resolveFinding(resource, checkName);
            }
        }
    }

    private async createOrUpdateFinding(resource: StorageResource, checkName: string, checkResult: any) {
        const controlId = this.mapCheckToControlId(checkName);
        const baseSeverity = await this.controlService.getBaseSeverity(controlId);
        const remediationAvailable = await this.controlService.isRemediationAvailable(controlId);
        const remediationGuidance = await this.controlService.getRemediationGuidance(controlId);

        const exposure = this.riskEngine.detectExposure(
            resource.configuration.policy,
            resource.configuration,
        );
        const riskScore = this.riskEngine.calculateRiskScore({
            baseSeverity,
            ...exposure,
        });

        await this.findingsService.create({
            tenant_id: resource.tenant_id,
            resource_id: resource.id,
            control_id: controlId,
            severity: baseSeverity,
            risk_score: riskScore,
            title: `${controlId}: ${checkResult.details || 'Security check failed'}`,
            description: `Resource ${resource.resource_id} is non-compliant with control ${controlId} (event-driven detection).`,
            evidence: checkResult,
            remediation_available: remediationAvailable,
            remediation_guidance: remediationGuidance,
        });
    }

    private async resolveFinding(resource: StorageResource, checkName: string) {
        const controlId = this.mapCheckToControlId(checkName);
        const finding = await this.findingsService.findOneByResourceAndControl(
            resource.id,
            controlId,
        );
        if (finding && finding.status === 'open') {
            await this.findingsService.resolve(finding.id);
            this.logger.log(`Resolved finding ${finding.id} for ${resource.resource_id} after event`);
        }
    }

    private mapCheckToControlId(checkName: string): string {
        const mapping = {
            checkPublicAccess: 'SG-001',
            checkEncryption: 'SG-002',
            checkLogging: 'SG-003',
            checkVersioning: 'SG-004',
            checkPolicy: 'SG-005',
        };
        return mapping[checkName] || 'SG-000';
    }

    private async saveResource(cloudAccount: CloudAccount, resourceData: any): Promise<StorageResource> {
        const resource = this.storageResourceRepository.create({
            tenant_id: cloudAccount.tenant_id,
            account_id: cloudAccount.id,
            provider: 'aws',
            resource_type: 'bucket',
            resource_id: resourceData.resource_id,
            region: resourceData.region,
            configuration: resourceData.configuration,
            discovered_at: new Date(),
        });
        return this.storageResourceRepository.save(resource);
    }
}