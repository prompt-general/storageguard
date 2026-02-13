// apps/api/src/findings/findings.controller.ts
import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    Query, UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('findings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('findings')
export class FindingsController {
    constructor(private readonly findingsService: FindingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new finding (internal use)' })
    create(@Body() createFindingDto: CreateFindingDto) {
        // In production, we'd extract tenant from JWT
        // For now, we assume tenant_id is provided in DTO
        return this.findingsService.create(createFindingDto);
    }

    @Get()
    @ApiOperation({ summary: 'List findings for current tenant' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'severity', required: false })
    @ApiQuery({ name: 'resource_id', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    async findAll(
        @Request() req,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
        @Query('resource_id') resource_id?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        // Mock tenant ID until auth is implemented
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.findingsService.findAllForTenant(tenantId, {
            status, severity, resource_id, limit, offset,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get findings statistics' })
    async getStatistics(@Request() req) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.findingsService.getStatistics(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get finding by ID' })
    findOne(@Param('id') id: string) {
        return this.findingsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update finding' })
    update(@Param('id') id: string, @Body() updateFindingDto: UpdateFindingDto) {
        return this.findingsService.update(id, updateFindingDto);
    }

    @Post(':id/suppress')
    @ApiOperation({ summary: 'Suppress finding' })
    suppress(@Param('id') id: string, @Body('reason') reason?: string) {
        return this.findingsService.suppress(id, reason);
    }

    @Post(':id/resolve')
    @ApiOperation({ summary: 'Resolve finding' })
    resolve(@Param('id') id: string) {
        return this.findingsService.resolve(id);
    }
}