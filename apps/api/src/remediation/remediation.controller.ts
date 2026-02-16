import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { UserRole } from '@storageguard/database';
import { RemediationService } from './remediation.service';

@ApiTags('remediation')
@ApiBearerAuth()
@Controller('remediation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemediationController {
    constructor(private remediationService: RemediationService) { }

    @Post('findings/:findingId/dry-run')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Perform a dry run of remediation for a finding' })
    async dryRun(@Param('findingId') findingId: string, @Tenant() tenantId: string) {
        return this.remediationService.dryRun(findingId, tenantId);
    }

    @Post('findings/:findingId/execute')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Execute remediation for a finding' })
    async execute(
        @Param('findingId') findingId: string,
        @Tenant() tenantId: string,
        @Body('force') force?: boolean,
    ) {
        return this.remediationService.execute(findingId, tenantId, { force });
    }

    @Post('actions/:actionId/rollback')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Rollback a previous remediation action' })
    async rollback(@Param('actionId') actionId: string, @Tenant() tenantId: string) {
        return this.remediationService.rollback(actionId, tenantId);
    }

    @Get('findings/:findingId/actions')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER, UserRole.PLATFORM_ENGINEER)
    @ApiOperation({ summary: 'List remediation actions for a finding' })
    async listActions(@Param('findingId') findingId: string, @Tenant() tenantId: string) {
        return this.remediationService.getRemediationActions(findingId, tenantId);
    }
}
