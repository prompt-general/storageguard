// apps/api/src/control/control.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ControlService } from './control.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('controls')
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