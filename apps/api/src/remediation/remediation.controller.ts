import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { RemediationService } from './remediation.service';

@ApiTags('remediation')
@ApiBearerAuth()
@Controller('remediation')
@UseGuards(JwtAuthGuard)
export class RemediationController {
    constructor(private readonly remediationService: RemediationService) { }

    @Post('findings/:findingId/dry-run')
    @ApiOperation({ summary: 'Perform a dry run of remediation for a finding' })
    async dryRun(
        @Param('findingId') findingId: string,
        @Tenant() tenantId: string
    ) {
        return this.remediationService.dryRun(findingId, tenantId);
    }

    @Post('findings/:findingId/execute')
    @ApiOperation({ summary: 'Execute remediation for a finding' })
    async execute(
        @Param('findingId') findingId: string,
        @Tenant() tenantId: string,
        @Body() options?: { force?: boolean }
    ) {
        return this.remediationService.execute(findingId, tenantId, options);
    }

    @Post('actions/:actionId/rollback')
    @ApiOperation({ summary: 'Roll back a previously executed remediation action' })
    async rollback(
        @Param('actionId') actionId: string,
        @Tenant() tenantId: string
    ) {
        return this.remediationService.rollback(actionId, tenantId);
    }

    @Get('findings/:findingId/actions')
    @ApiOperation({ summary: 'Get history of remediation actions for a finding' })
    async getActions(
        @Param('findingId') findingId: string,
        @Tenant() tenantId: string
    ) {
        return this.remediationService.getRemediationActions(findingId, tenantId);
    }
}
