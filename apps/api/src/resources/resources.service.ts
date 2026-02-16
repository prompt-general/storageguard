import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageResource } from '@storageguard/database';

@Injectable()
export class ResourcesService {
    constructor(
        @InjectRepository(StorageResource)
        private resourceRepository: Repository<StorageResource>,
    ) { }

    async updateBusinessContext(
        resourceId: string,
        tenantId: string,
        context: any,
    ): Promise<StorageResource> {
        const resource = await this.resourceRepository.findOne({
            where: { id: resourceId, tenant_id: tenantId },
        });
        if (!resource) {
            throw new NotFoundException('Resource not found');
        }
        resource.business_context = {
            ...resource.business_context,
            ...context,
        };
        return this.resourceRepository.save(resource);
    }

    async getBusinessContext(resourceId: string, tenantId: string): Promise<any> {
        const resource = await this.resourceRepository.findOne({
            where: { id: resourceId, tenant_id: tenantId },
            select: ['business_context'] as any,
        });
        if (!resource) {
            throw new NotFoundException('Resource not found');
        }
        return resource.business_context || {};
    }

    async listResources(tenantId: string, filters?: any): Promise<StorageResource[]> {
        const query = this.resourceRepository.createQueryBuilder('resource')
            .where('resource.tenant_id = :tenantId', { tenantId });

        if (filters?.environment) {
            query.andWhere("resource.business_context->>'environment' = :env", { env: filters.environment });
        }
        if (filters?.team) {
            query.andWhere("resource.business_context->>'team' = :team", { team: filters.team });
        }
        return query.getMany();
    }
}
