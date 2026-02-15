import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationChannel } from './entities/notification-channel.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { Finding } from '@storageguard/database';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(NotificationChannel)
        private channelRepository: Repository<NotificationChannel>,
        @InjectRepository(NotificationLog)
        private logRepository: Repository<NotificationLog>,
        private httpService: HttpService,
    ) { }

    async sendFindingNotification(finding: Finding) {
        // Find active channels for this tenant that notify on this severity
        const channels = await this.channelRepository.find({
            where: {
                tenant_id: finding.tenant_id,
                is_active: true,
            },
        });

        for (const channel of channels) {
            const severities = channel.notify_on_severities || ['critical', 'high'];
            if (!severities.includes(finding.severity)) {
                continue;
            }

            try {
                await this.sendToChannel(channel, finding);
                await this.logNotification(channel, finding, 'sent');
            } catch (error) {
                this.logger.error(`Failed to send notification to channel ${channel.id}:`, error);
                await this.logNotification(channel, finding, 'failed', error.message);
            }
        }
    }

    private async sendToChannel(channel: NotificationChannel, finding: Finding) {
        switch (channel.type) {
            case 'slack':
                await this.sendSlack(channel, finding);
                break;
            case 'email':
                await this.sendEmail(channel, finding);
                break;
            case 'webhook':
                await this.sendWebhook(channel, finding);
                break;
            default:
                this.logger.warn(`Unsupported channel type: ${channel.type}`);
        }
    }

    private async sendSlack(channel: NotificationChannel, finding: Finding) {
        const webhookUrl = channel.config.url;
        if (!webhookUrl) throw new Error('Slack webhook URL missing');

        const severityEmoji = {
            critical: ':rotating_light:',
            high: ':exclamation:',
            medium: ':warning:',
            low: ':information_source:',
            info: ':speech_balloon:',
        };

        const message = {
            text: `*New StorageGuard Finding*\nSeverity: ${finding.severity.toUpperCase()} ${severityEmoji[finding.severity] || ''}\nTitle: ${finding.title}\nResource: ${finding.storage_resource?.resource_id || 'unknown'}\nDescription: ${finding.description}\nRisk Score: ${finding.risk_score}\n<${process.env.APP_URL}/findings/${finding.id}|View in StorageGuard>`,
        };

        await firstValueFrom(this.httpService.post(webhookUrl, message));
    }

    private async sendEmail(channel: NotificationChannel, finding: Finding) {
        // Implementation using nodemailer
        // For now, placeholder
        this.logger.debug('Email notification not fully implemented');
    }

    private async sendWebhook(channel: NotificationChannel, finding: Finding) {
        const url = channel.config.url;
        if (!url) throw new Error('Webhook URL missing');

        const payload = {
            event: 'finding.created',
            tenant_id: finding.tenant_id,
            finding: {
                id: finding.id,
                severity: finding.severity,
                title: finding.title,
                description: finding.description,
                risk_score: finding.risk_score,
                resource_id: finding.resource_id,
                detected_at: finding.detected_at,
                control_id: finding.control_id,
            },
        };

        await firstValueFrom(this.httpService.post(url, payload));
    }

    private async logNotification(
        channel: NotificationChannel,
        finding: Finding,
        status: 'sent' | 'failed',
        error?: string,
    ) {
        const log = this.logRepository.create({
            tenant_id: finding.tenant_id,
            channel_id: channel.id,
            finding_id: finding.id,
            channel_type: channel.type,
            status,
            error_message: error,
        });
        await this.logRepository.save(log);
    }

    // CRUD for channels (admin only)
    async createChannel(data: Partial<NotificationChannel>): Promise<NotificationChannel> {
        const channel = this.channelRepository.create(data);
        return this.channelRepository.save(channel);
    }

    async updateChannel(id: string, data: Partial<NotificationChannel>): Promise<NotificationChannel> {
        await this.channelRepository.update(id, data);
        return this.channelRepository.findOne({ where: { id } });
    }

    async deleteChannel(id: string): Promise<void> {
        await this.channelRepository.delete(id);
    }

    async getChannels(tenantId: string): Promise<NotificationChannel[]> {
        return this.channelRepository.find({ where: { tenant_id: tenantId } });
    }
}
