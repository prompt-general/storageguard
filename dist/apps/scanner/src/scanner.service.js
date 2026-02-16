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
var ScannerService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const database_1 = require("@storageguard/database");
const aws_provider_1 = require("./providers/aws.provider");
const azure_provider_1 = require("./providers/azure.provider");
const gcp_provider_1 = require("./providers/gcp.provider");
const shared_1 = require("@storageguard/shared");
const findings_service_1 = require("../../../api/src/control/findings/findings.service");
const control_service_1 = require("../../../api/src/control/control.service");
let ScannerService = ScannerService_1 = class ScannerService {
    constructor(cloudAccountRepository, storageResourceRepository, findingsService, controlService) {
        this.cloudAccountRepository = cloudAccountRepository;
        this.storageResourceRepository = storageResourceRepository;
        this.findingsService = findingsService;
        this.controlService = controlService;
        this.logger = new common_1.Logger(ScannerService_1.name);
        this.riskEngine = new shared_1.RiskScoringEngine();
        this.providers = new Map();
        this.providers.set('aws', new aws_provider_1.AwsProvider());
        this.providers.set('azure', new azure_provider_1.AzureProvider());
        this.providers.set('gcp', new gcp_provider_1.GcpProvider());
    }
    async scanAllAccounts() {
        this.logger.log('Starting scheduled scan of all cloud accounts');
        const accounts = await this.cloudAccountRepository.find({
            where: { is_active: true },
        });
        for (const account of accounts) {
            try {
                await this.scanAccount(account);
            }
            catch (error) {
                this.logger.error(`Failed to scan account ${account.id}:`, error);
            }
        }
        this.logger.log('Completed scheduled scan');
    }
    async scanAccount(account) {
        this.logger.log(`Scanning ${account.provider} account: ${account.name}`);
        const provider = this.providers.get(account.provider);
        if (!provider) {
            this.logger.warn(`No provider implementation for ${account.provider}`);
            return;
        }
        try {
            const resources = await provider.listResources(account.credentials);
            for (const resource of resources) {
                await this.updateOrCreateResource(account, resource);
            }
            for (const resource of resources) {
                await this.runSecurityChecks(provider, account, resource);
            }
            account.last_scanned_at = new Date();
            await this.cloudAccountRepository.save(account);
        }
        catch (error) {
            this.logger.error(`Error scanning account ${account.id}:`, error);
            throw error;
        }
    }
    async updateOrCreateResource(account, resourceData) {
        const existing = await this.storageResourceRepository.findOne({
            where: {
                tenant_id: account.tenant_id,
                provider: account.provider,
                resource_id: resourceData.resource_id,
            },
        });
        if (existing) {
            existing.configuration = resourceData.configuration;
            existing.last_modified_at = new Date();
            await this.storageResourceRepository.save(existing);
        }
        else {
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
    async runSecurityChecks(provider, account, resource) {
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
            }
            catch (error) {
                this.logger.error(`Check ${controlId} failed for ${resource.resource_id}:`, error);
            }
        }
    }
    async evaluateCheckResult(controlId, resource, checkResult) {
        if (checkResult.failed) {
            const baseSeverity = await this.controlService.getBaseSeverity(controlId);
            const remediationAvailable = await this.controlService.isRemediationAvailable(controlId);
            const remediationGuidance = await this.controlService.getRemediationGuidance(controlId);
            const exposure = this.riskEngine.detectExposure(resource.configuration.policy, resource.configuration);
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
        }
        else {
        }
    }
};
exports.ScannerService = ScannerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScannerService.prototype, "scanAllAccounts", null);
exports.ScannerService = ScannerService = ScannerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(database_1.CloudAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(database_1.StorageResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, typeof (_a = typeof findings_service_1.FindingsService !== "undefined" && findings_service_1.FindingsService) === "function" ? _a : Object, typeof (_b = typeof control_service_1.ControlService !== "undefined" && control_service_1.ControlService) === "function" ? _b : Object])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map