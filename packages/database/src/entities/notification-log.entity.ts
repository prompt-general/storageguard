import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';


@Entity('notification_log')
export class NotificationLog extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'uuid', nullable: true })
    channel_id: string;

    @Column({ type: 'uuid' })
    finding_id: string;

    @Column({ type: 'text' })
    channel_type: string;

    @Column({ type: 'text' })
    status: 'sent' | 'failed';

    @Column({ type: 'text', nullable: true })
    error_message: string;

    @Column({ type: 'jsonb', nullable: true })
    response: any;
}
