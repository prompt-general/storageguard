"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventProcessorService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventProcessorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_1 = require("@storageguard/database");
const aws_provider_1 = require("../providers/aws.provider");
const azure_provider_1 = require("../providers/azure.provider");
const gcp_provider_1 = require("../providers/gcp.provider");
const findings_service_1 = require("../../../api/src/findings/findings.service");
const control_service_1 = require("../../../api/src/control/control.service");
const shared_1 = require("@storageguard/shared");
let EventProcessorService = EventProcessorService_1 = class EventProcessorService {
    constructor(cloudAccountRepository, storageResourceRepository, awsProvider, azureProvider, gcpProvider, findingsService, controlService) {
        this.cloudAccountRepository = cloudAccountRepository;
        this.storageResourceRepository = storageResourceRepository;
        this.awsProvider = awsProvider;
        this.azureProvider = azureProvider;
        this.gcpProvider = gcpProvider;
        this.findingsService = findingsService;
        this.controlService = controlService;
        this.logger = new common_1.Logger(EventProcessorService_1.name);
        this.riskEngine = new shared_1.RiskScoringEngine();
    }
    async processEvent(rawEvent) {
        try {
            if (rawEvent.source === 'aws.s3') {
                await this.processAwsEvent(rawEvent);
            }
            else if (rawEvent.source.includes('azure')) {
                await this.processAzureEvent(rawEvent);
            }
            else if (rawEvent.source.includes('google')) {
                await this.processGcpEvent(rawEvent);
            }
            else {
                this.logger.warn(`Unsupported event source: ${rawEvent.source}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to process event', error);
        }
    }
    async processAwsEvent(rawEvent) {
        const eventName = rawEvent.detail.eventName;
        const bucketName = this.extractBucketFromArn(rawEvent.resources?.[0]?.ARN);
        if (!bucketName) {
            this.logger.debug('Event does not involve a bucket, ignoring');
            return;
        }
        const accountId = rawEvent.account;
        const region = rawEvent.region;
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
        let storageResource = await this.storageResourceRepository.findOne({
            where: {
                tenant_id: cloudAccount.tenant_id,
                provider: 'aws',
                resource_id: bucketName,
            },
        });
        if (!storageResource) {
            this.logger.log(`Bucket ${bucketName} not in DB, scanning now`);
            const resources = await this.awsProvider.listResources(cloudAccount.credentials, region);
            const matched = resources.find(r => r.resource_id === bucketName);
            if (matched) {
                storageResource = await this.saveResource(cloudAccount, matched);
            }
            else {
                this.logger.warn(`Bucket ${bucketName} not found in provider scan`);
                return;
            }
        }
        const changedProperties = this.mapEventToProperties(eventName);
        if (changedProperties.length === 0) {
            this.logger.debug(`Event ${eventName} does not trigger security checks`);
            return;
        }
        await this.runSecurityChecks(cloudAccount, storageResource, changedProperties);
    }
    extractBucketFromArn(arn) {
        if (!arn)
            return null;
        const parts = arn.split(':');
        if (parts.length >= 6 && parts[2] === 's3') {
            return parts[5];
        }
        return null;
    }
    mapEventToProperties(eventName) {
        const mapping = {
            'PutBucketPolicy': ['policy'],
            'DeleteBucketPolicy': ['policy'],
            'PutBucketAcl': ['public_access'],
            'PutBucketPublicAccessBlock': ['public_access'],
            'PutBucketEncryption': ['encryption'],
            'DeleteBucketEncryption': ['encryption'],
            'PutBucketLogging': ['logging'],
            'PutBucketVersioning': ['versioning'],
            'PutBucketLifecycle': ['versioning'],
        };
        return mapping[eventName] || [];
    }
    async runSecurityChecks(cloudAccount, resource, changedProperties) {
        const refreshedResource = await this.awsProvider.refreshResource(cloudAccount.credentials, resource.resource_id, resource.region);
        if (!refreshedResource) {
            this.logger.error(`Failed to refresh resource ${resource.resource_id}`);
            return;
        }
        await this.storageResourceRepository.update(resource.id, {
            configuration: refreshedResource.configuration,
            last_modified_at: new Date(),
        });
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
        for (const checkName of checksToRun) {
            const checkMethod = this.awsProvider[checkName];
            if (!checkMethod)
                continue;
            const checkResult = await checkMethod.call(this.awsProvider, refreshedResource);
            if (checkResult.failed) {
                await this.createOrUpdateFinding(resource, checkName, checkResult);
            }
            else {
                await this.resolveFinding(resource, checkName);
            }
        }
    }
    async createOrUpdateFinding(resource, checkName, checkResult) {
        const controlId = this.mapCheckToControlId(checkName);
        const baseSeverity = await this.controlService.getBaseSeverity(controlId);
        const remediationAvailable = await this.controlService.isRemediationAvailable(controlId);
        const remediationGuidance = await this.controlService.getRemediationGuidance(controlId);
        const exposure = this.riskEngine.detectExposure(resource.configuration.policy, resource.configuration);
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
    async resolveFinding(resource, checkName) {
        const controlId = this.mapCheckToControlId(checkName);
        const finding = await this.findingsService.findOneByResourceAndControl(resource.id, controlId);
        if (finding && finding.status === 'open') {
            await this.findingsService.resolve(finding.id);
            this.logger.log(`Resolved finding ${finding.id} for ${resource.resource_id} after event`);
        }
    }
    mapCheckToControlId(checkName) {
        const mapping = {
            checkPublicAccess: 'SG-001',
            checkEncryption: 'SG-002',
            checkLogging: 'SG-003',
            checkVersioning: 'SG-004',
            checkPolicy: 'SG-005',
        };
        return mapping[checkName] || 'SG-000';
    }
    async processAzureEvent(event) {
        try {
            const subject = event.subject;
            const containerMatch = subject?.match(/\/containers\/([^\/]+)/);
            if (!containerMatch) {
                this.logger.debug('Event does not involve a container, ignoring');
                return;
            }
            const containerName = containerMatch[1];
            const storageAccountMatch = subject?.match(/\/storageAccounts\/([^\/]+)/);
            if (!storageAccountMatch) {
                this.logger.debug('Could not extract storage account name');
                return;
            }
            const storageAccountName = storageAccountMatch[1];
            const subscriptionId = event.data?.subscriptionId || subject?.match(/\/subscriptions\/([^\/]+)/)?.[1];
            if (!subscriptionId) {
                this.logger.debug('No subscription ID in event');
                return;
            }
            const cloudAccount = await this.cloudAccountRepository.findOne({
                where: {
                    provider: 'azure',
                    external_id: subscriptionId,
                    is_active: true,
                },
            });
            if (!cloudAccount) {
                this.logger.warn(`No active cloud account for Azure subscription ${subscriptionId}`);
                return;
            }
            const resourceId = `${storageAccountName}/${containerName}`;
            let storageResource = await this.storageResourceRepository.findOne({
                where: {
                    tenant_id: cloudAccount.tenant_id,
                    provider: 'azure',
                    resource_id: resourceId,
                },
            });
            if (!storageResource) {
                this.logger.log(`Container ${resourceId} not in DB, scanning now`);
                const resources = await this.azureProvider.listResources(cloudAccount.credentials);
                const matched = resources.find(r => r.resource_id === resourceId);
                if (matched) {
                    storageResource = await this.saveResource(cloudAccount, matched);
                }
                else {
                    this.logger.warn(`Container ${resourceId} not found in provider scan`);
                    return;
                }
            }
            const changedProperties = this.mapAzureEventToProperties(event.eventType);
            if (changedProperties.length === 0) {
                this.logger.debug(`Event type ${event.eventType} does not trigger checks`);
                return;
            }
            await this.runAzureSecurityChecks(cloudAccount, storageResource, changedProperties);
        }
        catch (error) {
            this.logger.error('Error processing Azure event', error);
        }
    }
    mapAzureEventToProperties(eventType) {
        const mapping = {
            'Microsoft.Storage.BlobCreated': ['public_access', 'policy'],
            'Microsoft.Storage.BlobDeleted': [],
            'Microsoft.Storage.BlobRenamed': [],
            'Microsoft.Storage.BlobTierChanged': [],
            'Microsoft.Storage.BlobInventoryPolicyCompleted': [],
            'Microsoft.Storage.StorageAccountCreated': ['public_access', 'encryption', 'logging', 'versioning'],
            'Microsoft.Storage.StorageAccountUpdated': ['public_access', 'encryption', 'logging', 'versioning'],
            'Microsoft.Storage.StorageAccountDeleted': [],
        };
        return mapping[eventType] || [];
    }
    async runAzureSecurityChecks(cloudAccount, resource, changedProperties) {
        const refreshedResource = await this.azureProvider.refreshResource(cloudAccount.credentials, resource.resource_id);
        if (!refreshedResource) {
            this.logger.error(`Failed to refresh Azure resource ${resource.resource_id}`);
            return;
        }
        await this.storageResourceRepository.update(resource.id, {
            configuration: refreshedResource.configuration,
            last_modified_at: new Date(),
        });
        const checksToRun = [];
        if (changedProperties.includes('public_access')) {
            checksToRun.push('checkPublicAccess');
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
        if (changedProperties.includes('policy')) {
            checksToRun.push('checkPolicy');
        }
        for (const checkName of checksToRun) {
            const checkMethod = this.azureProvider[checkName];
            if (!checkMethod)
                continue;
            const checkResult = await checkMethod.call(this.azureProvider, refreshedResource);
            if (checkResult.failed) {
                await this.createOrUpdateFinding(resource, checkName, checkResult);
            }
            else {
                await this.resolveFinding(resource, checkName);
            }
        }
    }
    async processGcpEvent(event) {
        try {
            const methodName = event.protoPayload?.methodName;
            const resourceName = event.protoPayload?.resourceName;
            const projectId = event.resource?.labels?.project_id;
            if (!resourceName || !projectId) {
                this.logger.debug('Missing resourceName or projectId in event');
                return;
            }
            const bucketMatch = resourceName.match(/buckets\/([^\/]+)/);
            if (!bucketMatch) {
                this.logger.debug('Event does not involve a bucket, ignoring');
                return;
            }
            const bucketName = bucketMatch[1];
            const cloudAccount = await this.cloudAccountRepository.findOne({
                where: {
                    provider: 'gcp',
                    external_id: projectId,
                    is_active: true,
                },
            });
            if (!cloudAccount) {
                this.logger.warn(`No active cloud account for GCP project ${projectId}`);
                return;
            }
            let storageResource = await this.storageResourceRepository.findOne({
                where: {
                    tenant_id: cloudAccount.tenant_id,
                    provider: 'gcp',
                    resource_id: bucketName,
                },
            });
            if (!storageResource) {
                this.logger.log(`Bucket ${bucketName} not in DB, scanning now`);
                const resources = await this.gcpProvider.listResources(cloudAccount.credentials);
                const matched = resources.find(r => r.resource_id === bucketName);
                if (matched) {
                    storageResource = await this.saveResource(cloudAccount, matched);
                }
                else {
                    this.logger.warn(`Bucket ${bucketName} not found in provider scan`);
                    return;
                }
            }
            const changedProperties = this.mapGcpMethodToProperties(methodName);
            if (changedProperties.length === 0) {
                this.logger.debug(`Method ${methodName} does not trigger checks`);
                return;
            }
            await this.runGcpSecurityChecks(cloudAccount, storageResource, changedProperties);
        }
        catch (error) {
            this.logger.error('Error processing GCP event', error);
        }
    }
    mapGcpMethodToProperties(methodName) {
        const mapping = {
            'storage.buckets.update': ['policy', 'encryption', 'logging', 'versioning'],
            'storage.buckets.patch': ['policy', 'encryption', 'logging', 'versioning'],
            'storage.setIamPermissions': ['policy'],
            'storage.buckets.delete': [],
            'storage.objects.create': [],
            'storage.objects.delete': [],
            'storage.buckets.updateIamPolicy': ['policy'],
        };
        return mapping[methodName] || [];
    }
    async runGcpSecurityChecks(cloudAccount, resource, changedProperties) {
        const refreshedResource = await this.gcpProvider.refreshResource(cloudAccount.credentials, resource.resource_id);
        if (!refreshedResource) {
            this.logger.error(`Failed to refresh GCP resource ${resource.resource_id}`);
            return;
        }
        await this.storageResourceRepository.update(resource.id, {
            configuration: refreshedResource.configuration,
            last_modified_at: new Date(),
        });
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
        for (const checkName of checksToRun) {
            const checkMethod = this.gcpProvider[checkName];
            if (!checkMethod)
                continue;
            const checkResult = await checkMethod.call(this.gcpProvider, refreshedResource);
            if (checkResult.failed) {
                await this.createOrUpdateFinding(resource, checkName, checkResult);
            }
            else {
                await this.resolveFinding(resource, checkName);
            }
        }
    }
    async saveResource(cloudAccount, resourceData) {
        const resource = this.storageResourceRepository.create({
            tenant_id: cloudAccount.tenant_id,
            account_id: cloudAccount.id,
            provider: cloudAccount.provider,
            resource_type: resourceData.resource_type,
            resource_id: resourceData.resource_id,
            region: resourceData.region,
            configuration: resourceData.configuration,
            discovered_at: new Date(),
        });
        return this.storageResourceRepository.save(resource);
    }
};
exports.EventProcessorService = EventProcessorService;
exports.EventProcessorService = EventProcessorService = EventProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(database_1.CloudAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(database_1.StorageResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        aws_provider_1.AwsProvider,
        azure_provider_1.AzureProvider,
        gcp_provider_1.GcpProvider, typeof (_a = typeof findings_service_1.FindingsService !== "undefined" && findings_service_1.FindingsService) === "function" ? _a : Object, control_service_1.ControlService])
], EventProcessorService);
//# sourceMappingURL=event-processor.service.js.map