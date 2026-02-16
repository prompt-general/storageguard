import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
export declare class FindingsController {
    private readonly findingsService;
    constructor(findingsService: FindingsService);
    create(createFindingDto: CreateFindingDto, tenantId: string): Promise<Finding>;
    findAll(tenantId: string, status?: string, severity?: string, resource_id?: string, limit?: number, offset?: number): Promise<{
        items: Finding[];
        total: number;
    }>;
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
    findOne(id: string, tenantId: string): Promise<Finding>;
    update(id: string, updateFindingDto: UpdateFindingDto, tenantId: string): Promise<Finding>;
    suppress(id: string, reason?: string, tenantId: string): Promise<Finding>;
    resolve(id: string, tenantId: string): Promise<Finding>;
}
