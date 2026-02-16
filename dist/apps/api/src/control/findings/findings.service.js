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
var FindingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_1 = require("@storageguard/database");
const control_service_1 = require("../control.service");
const shared_1 = require("@storageguard/shared");
const notification_service_1 = require("../../notification/notification.service");
let FindingsService = FindingsService_1 = class FindingsService {
    constructor(findingRepository, storageResourceRepository, controlService, notificationService) {
        this.findingRepository = findingRepository;
        this.storageResourceRepository = storageResourceRepository;
        this.controlService = controlService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(FindingsService_1.name);
        this.riskEngine = new shared_1.RiskScoringEngine();
    }
    async create(createFindingDto) {
        const existing = await this.findingRepository.findOne({
            where: {
                resource_id: createFindingDto.resource_id,
                control_id: createFindingDto.control_id,
            },
        });
        const now = new Date();
        if (existing) {
            existing.severity = createFindingDto.severity;
            existing.risk_score = createFindingDto.risk_score;
            existing.title = createFindingDto.title;
            existing.description = createFindingDto.description;
            existing.evidence = createFindingDto.evidence;
            existing.remediation_available = createFindingDto.remediation_available ?? true;
            existing.remediation_guidance = createFindingDto.remediation_guidance;
            existing.last_seen_at = now;
            if (existing.status === 'resolved' || existing.status === 'fixed') {
                existing.status = 'open';
                existing.resolved_at = null;
            }
            const saved = await this.findingRepository.save(existing);
            this.triggerNotificationIfCritical(saved);
            return saved;
        }
        const finding = this.findingRepository.create({
            ...createFindingDto,
            status: 'open',
            detected_at: now,
            last_seen_at: now,
        });
        const saved = await this.findingRepository.save(finding);
        this.triggerNotificationIfCritical(saved);
        return saved;
    }
    async findAllForTenant(tenantId, options) {
        const query = this.findingRepository
            .createQueryBuilder('finding')
            .leftJoinAndSelect('finding.storage_resource', 'resource')
            .where('finding.tenant_id = :tenantId', { tenantId });
        if (options?.status) {
            query.andWhere('finding.status = :status', { status: options.status });
        }
        if (options?.severity) {
            query.andWhere('finding.severity = :severity', { severity: options.severity });
        }
        if (options?.resource_id) {
            query.andWhere('finding.resource_id = :resourceId', { resourceId: options.resource_id });
        }
        query.orderBy('finding.risk_score', 'DESC')
            .addOrderBy('finding.last_seen_at', 'DESC');
        if (options?.limit) {
            query.take(options.limit);
        }
        if (options?.offset) {
            query.skip(options.offset);
        }
        const [items, total] = await query.getManyAndCount();
        return { items, total };
    }
    async findOne(id, tenantId) {
        const query = this.findingRepository
            .createQueryBuilder('finding')
            .leftJoinAndSelect('finding.storage_resource', 'resource')
            .where('finding.id = :id', { id });
        if (tenantId) {
            query.andWhere('finding.tenant_id = :tenantId', { tenantId });
        }
        const finding = await query.getOne();
        if (!finding) {
            throw new common_1.NotFoundException(`Finding with ID ${id} not found`);
        }
        return finding;
    }
    async update(id, updateFindingDto, tenantId) {
        const finding = await this.findOne(id, tenantId);
        Object.assign(finding, updateFindingDto);
        const saved = await this.findingRepository.save(finding);
        this.triggerNotificationIfCritical(saved);
        return saved;
    }
    triggerNotificationIfCritical(finding) {
        if (finding.severity === 'critical' || finding.severity === 'high') {
            this.notificationService.sendFindingNotification(finding).catch(e => this.logger.error(`Failed to send notification for finding ${finding.id}`, e));
        }
    }
    async suppress(id, reason, tenantId) {
        const finding = await this.findOne(id, tenantId);
        finding.status = 'suppressed';
        finding.evidence = {
            ...finding.evidence,
            suppressed_at: new Date(),
            suppression_reason: reason || 'Manually suppressed',
        };
        return this.findingRepository.save(finding);
    }
    async resolve(id, tenantId) {
        const finding = await this.findOne(id, tenantId);
        finding.status = 'resolved';
        finding.resolved_at = new Date();
        return this.findingRepository.save(finding);
    }
    async findOneByResourceAndControl(resourceId, controlId) {
        return this.findingRepository.findOne({
            where: { resource_id: resourceId, control_id: controlId },
        });
    }
    async getStatistics(tenantId) {
        const result = await this.findingRepository
            .createQueryBuilder('finding')
            .select('finding.severity', 'severity')
            .addSelect('COUNT(*)', 'count')
            .where('finding.tenant_id = :tenantId', { tenantId })
            .andWhere('finding.status IN (:...statuses)', { statuses: ['open', 'suppressed'] })
            .groupBy('finding.severity')
            .getRawMany();
        const total = await this.findingRepository
            .createQueryBuilder('finding')
            .where('finding.tenant_id = :tenantId', { tenantId })
            .andWhere('finding.status IN (:...statuses)', { statuses: ['open', 'suppressed'] })
            .getCount();
        const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
        };
        result.forEach((row) => {
            severityCounts[row.severity] = parseInt(row.count, 10);
        });
        return {
            total,
            by_severity: severityCounts,
        };
    }
};
exports.FindingsService = FindingsService;
exports.FindingsService = FindingsService = FindingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(database_1.Finding)),
    __param(1, (0, typeorm_1.InjectRepository)(database_1.StorageResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        control_service_1.ControlService,
        notification_service_1.NotificationService])
], FindingsService);
//# sourceMappingURL=findings.service.js.map