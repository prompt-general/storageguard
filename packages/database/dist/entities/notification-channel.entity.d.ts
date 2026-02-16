import { BaseEntity } from './base.entity';
export type ChannelType = 'slack' | 'email' | 'webhook';
export declare class NotificationChannel extends BaseEntity {
    tenant_id: string;
    name: string;
    type: ChannelType;
    config: {
        url?: string;
        email?: string;
        apiKey?: string;
        channel?: string;
    };
    notify_on_severities: string[];
    is_active: boolean;
}
