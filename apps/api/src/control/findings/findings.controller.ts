import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    Query, UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Tenant } from '../../auth/decorators/tenant.decorator';
import { UserRole } from '@storageguard/database';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';

@ApiTags('findings')
@ApiBearerAuth()
@Controller('findings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FindingsController {
    constructor(private readonly findingsService: FindingsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Create a new finding (internal use)' })
    create(@Body() createFindingDto: CreateFindingDto, @Tenant() tenantId: string) {
        // Override tenant_id from token
        createFindingDto.tenant_id = tenantId;
        return this.findingsService.create(createFindingDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER, UserRole.PLATFORM_ENGINEER, UserRole.VIEWER)
    @ApiOperation({ summary: 'List findings for current tenant' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'severity', required: false })
    @ApiQuery({ name: 'resource_id', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    async findAll(
        @Tenant() tenantId: string,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
        @Query('resource_id') resource_id?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.findingsService.findAllForTenant(tenantId, {
            status, severity, resource_id, limit, offset,
        });
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER, UserRole.PLATFORM_ENGINEER, UserRole.VIEWER)
    @ApiOperation({ summary: 'Get findings statistics' })
    async getStatistics(@Tenant() tenantId: string) {
        return this.findingsService.getStatistics(tenantId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER, UserRole.PLATFORM_ENGINEER, UserRole.VIEWER)
    @ApiOperation({ summary: 'Get finding by ID' })
    findOne(@Param('id') id: string, @Tenant() tenantId: string) {
        return this.findingsService.findOne(id); // Service should verify tenant
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Update finding' })
    update(@Param('id') id: string, @Body() updateFindingDto: UpdateFindingDto, @Tenant() tenantId: string) {
        // Ensure tenant access
        return this.findingsService.update(id, updateFindingDto);
    }

    @Post(':id/suppress')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Suppress finding' })
    suppress(@Param('id') id: string, @Body('reason') reason?: string, @Tenant() tenantId: string) {
        return this.findingsService.suppress(id, reason);
    }

    @Post(':id/resolve')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'Resolve finding' })
    resolve(@Param('id') id: string, @Tenant() tenantId: string) {
        return this.findingsService.resolve(id);
    }
}