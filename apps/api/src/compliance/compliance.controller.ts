import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
    constructor(private complianceService: ComplianceService) { }

    @Get('frameworks')
    @ApiOperation({ summary: 'List supported compliance frameworks' })
    async getFrameworks() {
        return this.complianceService.getFrameworks();
    }

    @Get('overview')
    @ApiOperation({ summary: 'Get compliance overview across all frameworks' })
    async getOverview(@Tenant() tenantId: string) {
        return this.complianceService.getComplianceOverview(tenantId);
    }

    @Get('frameworks/:frameworkId')
    @ApiOperation({ summary: 'Get compliance status for a specific framework' })
    async getFrameworkStatus(
        @Tenant() tenantId: string,
        @Param('frameworkId') frameworkId: string,
    ) {
        return this.complianceService.getFrameworkCompliance(tenantId, frameworkId);
    }

    @Get('resources/:resourceId')
    @ApiOperation({ summary: 'Get compliance status for a specific resource' })
    async getResourceCompliance(
        @Tenant() tenantId: string,
        @Param('resourceId') resourceId: string,
    ) {
        return this.complianceService.getComplianceByResource(tenantId, resourceId);
    }
}
