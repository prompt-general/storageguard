import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { NotificationChannel } from './entities/notification-channel.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { Finding } from '@storageguard/database';
export declare class NotificationService {
    private channelRepository;
    private logRepository;
    private httpService;
    private readonly logger;
    constructor(channelRepository: Repository<NotificationChannel>, logRepository: Repository<NotificationLog>, httpService: HttpService);
    sendFindingNotification(finding: Finding): Promise<void>;
    private sendToChannel;
    private sendSlack;
    private sendEmail;
    private sendWebhook;
    private logNotification;
    createChannel(data: Partial<NotificationChannel>): Promise<NotificationChannel>;
    updateChannel(id: string, data: Partial<NotificationChannel>): Promise<NotificationChannel>;
    deleteChannel(id: string): Promise<void>;
    getChannels(tenantId: string): Promise<NotificationChannel[]>;
}
