"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const notification_channel_entity_1 = require("./entities/notification-channel.entity");
const notification_log_entity_1 = require("./entities/notification-log.entity");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(channelRepository, logRepository, httpService) {
        this.channelRepository = channelRepository;
        this.logRepository = logRepository;
        this.httpService = httpService;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendFindingNotification(finding) {
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
            }
            catch (error) {
                this.logger.error(`Failed to send notification to channel ${channel.id}:`, error);
                await this.logNotification(channel, finding, 'failed', error.message);
            }
        }
    }
    async sendToChannel(channel, finding) {
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
    async sendSlack(channel, finding) {
        const webhookUrl = channel.config.url;
        if (!webhookUrl)
            throw new Error('Slack webhook URL missing');
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
        await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, message));
    }
    async sendEmail(channel, finding) {
        this.logger.debug('Email notification not fully implemented');
    }
    async sendWebhook(channel, finding) {
        const url = channel.config.url;
        if (!url)
            throw new Error('Webhook URL missing');
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
        await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, payload));
    }
    async logNotification(channel, finding, status, error) {
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
    async createChannel(data) {
        const channel = this.channelRepository.create(data);
        return this.channelRepository.save(channel);
    }
    async updateChannel(id, data) {
        await this.channelRepository.update(id, data);
        const channel = await this.channelRepository.findOne({ where: { id } });
        if (!channel)
            throw new Error('Channel not found');
        return channel;
    }
    async deleteChannel(id) {
        await this.channelRepository.delete(id);
    }
    async getChannels(tenantId) {
        return this.channelRepository.find({ where: { tenant_id: tenantId } });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_channel_entity_1.NotificationChannel)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_log_entity_1.NotificationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map