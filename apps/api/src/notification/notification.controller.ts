import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../auth/decorators/tenant.decorator';
import { UserRole } from '@storageguard/database';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './entities/notification-channel.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @Get('channels')
    @Roles(UserRole.ADMIN, UserRole.SECURITY_ENGINEER)
    @ApiOperation({ summary: 'List notification channels' })
    async getChannels(@Tenant() tenantId: string) {
        return this.notificationService.getChannels(tenantId);
    }

    @Post('channels')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create notification channel' })
    async createChannel(@Tenant() tenantId: string, @Body() data: Partial<NotificationChannel>) {
        data.tenant_id = tenantId;
        return this.notificationService.createChannel(data);
    }

    @Put('channels/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update notification channel' })
    async updateChannel(@Param('id') id: string, @Body() data: Partial<NotificationChannel>) {
        return this.notificationService.updateChannel(id, data);
    }

    @Delete('channels/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete notification channel' })
    async deleteChannel(@Param('id') id: string) {
        await this.notificationService.deleteChannel(id);
        return { success: true };
    }
}
