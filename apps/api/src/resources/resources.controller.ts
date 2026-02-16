import { Controller, Get, Body, Put, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { UserRole } from '@storageguard/database';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'List all storage resources' })
    async findAll(@Tenant() tenantId: string) {
        return this.resourcesService.findAll(tenantId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Get a single resource' })
    async findOne(@Param('id') id: string, @Tenant() tenantId: string) {
        return this.resourcesService.findOne(id, tenantId);
    }

    @Put(':id/business-context')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Update business context for a resource' })
    async updateBusinessContext(
        @Param('id') id: string,
        @Tenant() tenantId: string,
        @Body() businessContext: any,
    ) {
        return this.resourcesService.updateBusinessContext(id, tenantId, businessContext);
    }
}
