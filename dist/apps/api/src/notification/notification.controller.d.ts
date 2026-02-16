import { NotificationService } from './notification.service';
import { NotificationChannel } from './entities/notification-channel.entity';
export declare class NotificationController {
    private notificationService;
    constructor(notificationService: NotificationService);
    getChannels(tenantId: string): Promise<NotificationChannel[]>;
    createChannel(tenantId: string, data: Partial<NotificationChannel>): Promise<NotificationChannel>;
    updateChannel(id: string, data: Partial<NotificationChannel>): Promise<NotificationChannel>;
    deleteChannel(id: string): Promise<{
        success: boolean;
    }>;
}
