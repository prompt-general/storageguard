import { Repository } from 'typeorm';
import { Finding, StorageResource } from '@storageguard/database';
import { ControlService } from '../control.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { NotificationService } from '../../notification/notification.service';
export declare class FindingsService {
    private findingRepository;
    private storageResourceRepository;
    private controlService;
    private notificationService;
    private readonly logger;
    private riskEngine;
    constructor(findingRepository: Repository<Finding>, storageResourceRepository: Repository<StorageResource>, controlService: ControlService, notificationService: NotificationService);
    create(createFindingDto: CreateFindingDto): Promise<Finding>;
    findAllForTenant(tenantId: string, options?: {
        status?: string;
        severity?: string;
        resource_id?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: Finding[];
        total: number;
    }>;
    findOne(id: string, tenantId?: string): Promise<Finding>;
    update(id: string, updateFindingDto: UpdateFindingDto, tenantId?: string): Promise<Finding>;
    private triggerNotificationIfCritical;
    suppress(id: string, reason?: string, tenantId?: string): Promise<Finding>;
    resolve(id: string, tenantId?: string): Promise<Finding>;
    findOneByResourceAndControl(resourceId: string, controlId: string): Promise<Finding | null>;
    getStatistics(tenantId: string): Promise<{
        total: number;
        by_severity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
            info: number;
        };
    }>;
}
