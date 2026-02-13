import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ControlService } from './control.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('controls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('controls')
export class ControlController {
    constructor(private readonly controlService: ControlService) { }

    @Get()
    @ApiOperation({ summary: 'List all security controls' })
    async findAll() {
        return this.controlService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get control by ID' })
    async findOne(@Param('id') id: string) {
        return this.controlService.findById(id);
    }
}