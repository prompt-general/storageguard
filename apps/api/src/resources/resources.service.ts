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

    async findAll(tenantId: string) {
        return this.resourceRepository.find({
            where: { tenant_id: tenantId },
            order: { discovered_at: 'DESC' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const resource = await this.resourceRepository.findOne({
            where: { id, tenant_id: tenantId },
        });

        if (!resource) {
            throw new NotFoundException(`Resource with ID ${id} not found`);
        }

        return resource;
    }

    async updateBusinessContext(id: string, tenantId: string, businessContext: any) {
        const resource = await this.findOne(id, tenantId);

        resource.business_context = {
            ...resource.business_context,
            ...businessContext,
        };

        return this.resourceRepository.save(resource);
    }
}
