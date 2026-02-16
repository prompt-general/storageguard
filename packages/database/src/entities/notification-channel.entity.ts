import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';


export type ChannelType = 'slack' | 'email' | 'webhook';

@Entity('notification_channel')
export class NotificationChannel extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text' })
    type: ChannelType;

    @Column({ type: 'jsonb' })
    config: {
        url?: string;           // Slack webhook URL, generic webhook URL
        email?: string;         // Email address
        apiKey?: string;        // For future integrations
        channel?: string;       // Slack channel override
    };

    @Column({ type: 'simple-array', nullable: true })
    notify_on_severities: string[]; // e.g., ['critical', 'high']

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
