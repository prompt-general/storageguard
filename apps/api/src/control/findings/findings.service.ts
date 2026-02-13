// apps/api/src/findings/findings.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finding, StorageResource } from '@storageguard/database';
import { ControlService } from '../control.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { RiskScoringEngine } from '@storageguard/shared';

@Injectable()
export class FindingsService {
    private readonly logger = new Logger(FindingsService.name);
    private riskEngine: RiskScoringEngine;

    constructor(
        @InjectRepository(Finding)
        private findingRepository: Repository<Finding>,
        @InjectRepository(StorageResource)
        private storageResourceRepository: Repository<StorageResource>,
        private controlService: ControlService,
    ) {
        this.riskEngine = new RiskScoringEngine();
    }

    async create(createFindingDto: CreateFindingDto): Promise<Finding> {
        // Check if finding already exists for this resource and control
        const existing = await this.findingRepository.findOne({
            where: {
                resource_id: createFindingDto.resource_id,
                control_id: createFindingDto.control_id,
            },
        });

        const now = new Date();

        if (existing) {
            // Update existing finding
            existing.severity = createFindingDto.severity;
            existing.risk_score = createFindingDto.risk_score;
            existing.title = createFindingDto.title;
            existing.description = createFindingDto.description;
            existing.evidence = createFindingDto.evidence;
            existing.remediation_available = createFindingDto.remediation_available ?? true;
            existing.remediation_guidance = createFindingDto.remediation_guidance;
            existing.last_seen_at = now;

            // If it was resolved but now reappears, reopen it
            if (existing.status === 'resolved' || existing.status === 'fixed') {
                existing.status = 'open';
                existing.resolved_at = null;
            }

            return this.findingRepository.save(existing);
        }

        // Create new finding
        const finding = this.findingRepository.create({
            ...createFindingDto,
            status: 'open',
            detected_at: now,
            last_seen_at: now,
        });

        return this.findingRepository.save(finding);
    }

    async findAllForTenant(
        tenantId: string,
        options?: {
            status?: string;
            severity?: string;
            resource_id?: string;
            limit?: number;
            offset?: number;
        }
    ) {
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

    async findOne(id: string): Promise<Finding> {
        const finding = await this.findingRepository.findOne({
            where: { id },
            relations: ['storage_resource'],
        });

        if (!finding) {
            throw new NotFoundException(`Finding with ID ${id} not found`);
        }

        return finding;
    }

    async update(id: string, updateFindingDto: UpdateFindingDto): Promise<Finding> {
        const finding = await this.findOne(id);

        // If status is being updated to resolved, set resolved_at
        if (updateFindingDto.status === 'resolved' || updateFindingDto.status === 'fixed') {
            finding.resolved_at = new Date();
        }

        Object.assign(finding, updateFindingDto);
        return this.findingRepository.save(finding);
    }

    async suppress(id: string, reason?: string): Promise<Finding> {
        const finding = await this.findOne(id);
        finding.status = 'suppressed';
        finding.evidence = {
            ...finding.evidence,
            suppressed_at: new Date(),
            suppression_reason: reason || 'Manually suppressed',
        };
        return this.findingRepository.save(finding);
    }

    async resolve(id: string): Promise<Finding> {
        const finding = await this.findOne(id);
        finding.status = 'resolved';
        finding.resolved_at = new Date();
        return this.findingRepository.save(finding);
    }

    async getStatistics(tenantId: string) {
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
}