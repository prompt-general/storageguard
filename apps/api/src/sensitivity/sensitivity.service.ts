import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageResource } from '@storageguard/database';
import { SensitivityScannerService } from '@storageguard/scanner/sensitivity/sensitivity-scanner.service';

@Injectable()
export class SensitivityService {
    constructor(
        @InjectRepository(StorageResource)
        private resourceRepository: Repository<StorageResource>,
        private scanner: SensitivityScannerService,
    ) { }

    async scanResource(resourceId: string, tenantId: string): Promise<any> {
        const resource = await this.resourceRepository.findOne({
            where: { id: resourceId, tenant_id: tenantId },
        });
        if (!resource) throw new NotFoundException('Resource not found');
        // Trigger async scan (could run in background)
        // For simplicity, we'll run synchronously; in production, queue.
        return this.scanner.scanResource(resourceId, tenantId);
    }

    async getScanResult(resourceId: string, tenantId: string): Promise<any> {
        const resource = await this.resourceRepository.findOne({
            where: { id: resourceId, tenant_id: tenantId },
            select: ['sensitivity'],
        });
        if (!resource) throw new NotFoundException('Resource not found');
        return resource.sensitivity || { scan_status: 'not_scanned' };
    }

    async getOverview(tenantId: string): Promise<any> {
        const resources = await this.resourceRepository.find({
            where: { tenant_id: tenantId },
            select: ['id', 'resource_id', 'sensitivity', 'business_context'],
        });

        const total = resources.length;
        const scanned = resources.filter(r => r.sensitivity?.scan_status === 'completed').length;
        const withSensitiveData = resources.filter(r => r.sensitivity?.has_sensitive_data).length;
        const byType = {};
        resources.forEach(r => {
            if (r.sensitivity?.sensitive_data_types) {
                r.sensitivity.sensitive_data_types.forEach(type => {
                    byType[type] = (byType[type] || 0) + 1;
                });
            }
        });

        return {
            total_resources: total,
            scanned_resources: scanned,
            resources_with_sensitive_data: withSensitiveData,
            sensitive_data_types: byType,
        };
    }
}
