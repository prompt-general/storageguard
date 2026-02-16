import { Controller, Get, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
    constructor(private resourcesService: ResourcesService) { }

    @Get()
    @ApiOperation({ summary: 'List all storage resources with optional filters' })
    async list(
        @Tenant() tenantId: string,
        @Query('environment') environment?: string,
        @Query('team') team?: string,
    ) {
        return this.resourcesService.listResources(tenantId, { environment, team });
    }

    @Get(':id/context')
    @ApiOperation({ summary: 'Get business context for a resource' })
    async getContext(@Param('id') id: string, @Tenant() tenantId: string) {
        return this.resourcesService.getBusinessContext(id, tenantId);
    }

    @Put(':id/context')
    @ApiOperation({ summary: 'Update business context for a resource' })
    async updateContext(
        @Param('id') id: string,
        @Tenant() tenantId: string,
        @Body() context: any,
    ) {
        return this.resourcesService.updateBusinessContext(id, tenantId, context);
    }
}
