// apps/scanner/src/scanner.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
    CloudAccount,
    StorageResource,
    Finding,
    CloudProvider
} from '@storageguard/database';
import { CloudProviderInterface } from '@storageguard/shared';
import { AwsProvider } from './providers/aws.provider';
import { AzureProvider } from './providers/azure.provider';
import { GcpProvider } from './providers/gcp.provider';
import { RiskScoringEngine } from '@storageguard/shared';
import { FindingsService } from '../../../api/src/control/findings/findings.service';
import { ControlService } from '../../../api/src/control/control.service';

@Injectable()
export class ScannerService {
    private readonly logger = new Logger(ScannerService.name);
    private providers: Map<CloudProvider, CloudProviderInterface>;
    private riskEngine: RiskScoringEngine;

    constructor(
        @InjectRepository(CloudAccount)
        private cloudAccountRepository: Repository<CloudAccount>,
        @InjectRepository(StorageResource)
        private storageResourceRepository: Repository<StorageResource>,
        private findingsService: FindingsService,
        private controlService: ControlService,
    ) {
        this.riskEngine = new RiskScoringEngine();
        this.providers = new Map();
        this.providers.set('aws', new AwsProvider());
        // Initialize Azure and GCP providers when ready
        // this.providers.set('azure', new AzureProvider());
        // this.providers.set('gcp', new GcpProvider());
    }

    @Cron(CronExpression.EVERY_HOUR)
    async scanAllAccounts() {
        this.logger.log('Starting scheduled scan of all cloud accounts');

        const accounts = await this.cloudAccountRepository.find({
            where: { is_active: true },
        });

        for (const account of accounts) {
            try {
                await this.scanAccount(account);
            } catch (error) {
                this.logger.error(`Failed to scan account ${account.id}:`, error);
            }
        }

        this.logger.log('Completed scheduled scan');
    }

    async scanAccount(account: CloudAccount) {
        this.logger.log(`Scanning ${account.provider} account: ${account.name}`);

        const provider = this.providers.get(account.provider);
        if (!provider) {
            this.logger.warn(`No provider implementation for ${account.provider}`);
            return;
        }

        try {
            // 1. List all storage resources
            const resources = await provider.listResources(account.credentials);

            // 2. Update storage resource database
            for (const resource of resources) {
                await this.updateOrCreateResource(account, resource);
            }

            // 3. Run security checks on each resource
            for (const resource of resources) {
                await this.runSecurityChecks(provider, account, resource);
            }

            // 4. Update account last scanned timestamp
            account.last_scanned_at = new Date();
            await this.cloudAccountRepository.save(account);

        } catch (error) {
            this.logger.error(`Error scanning account ${account.id}:`, error);
            throw error;
        }
    }

    private async updateOrCreateResource(
        account: CloudAccount,
        resourceData: any
    ) {
        const existing = await this.storageResourceRepository.findOne({
            where: {
                tenant_id: account.tenant_id,
                provider: account.provider,
                resource_id: resourceData.resource_id,
            },
        });

        if (existing) {
            // Update existing resource
            existing.configuration = resourceData.configuration;
            existing.last_modified_at = new Date();
            await this.storageResourceRepository.save(existing);
        } else {
            // Create new resource
            const resource = this.storageResourceRepository.create({
                tenant_id: account.tenant_id,
                account_id: account.id,
                provider: account.provider,
                resource_type: resourceData.resource_type,
                resource_id: resourceData.resource_id,
                region: resourceData.region,
                configuration: resourceData.configuration,
                discovered_at: new Date(),
            });
            await this.storageResourceRepository.save(resource);
        }
    }

    private async runSecurityChecks(
        provider: CloudProviderInterface,
        account: CloudAccount,
        resource: StorageResource
    ) {
        const checks = [
            { controlId: 'SG-001', check: provider.checkPublicAccess.bind(provider) },
            { controlId: 'SG-002', check: provider.checkEncryption.bind(provider) },
            { controlId: 'SG-003', check: provider.checkLogging.bind(provider) },
            { controlId: 'SG-004', check: provider.checkVersioning.bind(provider) },
            { controlId: 'SG-005', check: provider.checkPolicy.bind(provider) },
        ];

        for (const { controlId, check } of checks) {
            try {
                const result = await check(resource);
                await this.evaluateCheckResult(controlId, resource, result);
            } catch (error) {
                this.logger.error(`Check ${controlId} failed for ${resource.resource_id}:`, error);
            }
        }
    }

    private async evaluateCheckResult(
        controlId: string,
        resource: StorageResource,
        checkResult: any
    ) {
        if (checkResult.failed) {
            const baseSeverity = await this.controlService.getBaseSeverity(controlId);
            const remediationAvailable = await this.controlService.isRemediationAvailable(controlId);
            const remediationGuidance = await this.controlService.getRemediationGuidance(controlId);

            const exposure = this.riskEngine.detectExposure(
                resource.configuration.policy,
                resource.configuration
            );

            const riskScore = this.riskEngine.calculateRiskScore({
                baseSeverity,
                ...exposure
            });

            await this.findingsService.create({
                tenant_id: resource.tenant_id,
                resource_id: resource.id,
                control_id: controlId,
                severity: baseSeverity,
                risk_score: riskScore,
                title: `${controlId}: ${checkResult.details || 'Security check failed'}`,
                description: `Resource ${resource.resource_id} is non-compliant with control ${controlId}.`,
                evidence: checkResult,
                remediation_available: remediationAvailable,
                remediation_guidance: remediationGuidance,
            });
        } else {
            // If the check passed but there was an open finding for this resource/control, resolve it
            // This would require finding and resolving; we'll implement later.
        }
    }
}