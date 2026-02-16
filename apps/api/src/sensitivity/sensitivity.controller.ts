import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { UserRole } from '@storageguard/database';
import { SensitivityService } from './sensitivity.service';

@ApiTags('sensitivity')
@ApiBearerAuth()
@Controller('sensitivity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SensitivityController {
    constructor(private sensitivityService: SensitivityService) { }

    @Post('resources/:resourceId/scan')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Trigger a sensitivity scan for a resource' })
    async scanResource(@Param('resourceId') resourceId: string, @Tenant() tenantId: string) {
        return this.sensitivityService.scanResource(resourceId, tenantId);
    }

    @Get('resources/:resourceId/result')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER, UserRole.PLATFORM_ENGINEER)
    @ApiOperation({ summary: 'Get sensitivity scan result for a resource' })
    async getScanResult(@Param('resourceId') resourceId: string, @Tenant() tenantId: string) {
        return this.sensitivityService.getScanResult(resourceId, tenantId);
    }

    @Get('overview')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Overview of sensitive data across all resources' })
    async getOverview(@Tenant() tenantId: string) {
        return this.sensitivityService.getOverview(tenantId);
    }
}
