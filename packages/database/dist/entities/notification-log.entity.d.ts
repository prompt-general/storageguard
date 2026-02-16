import { BaseEntity } from './base.entity';
export declare class NotificationLog extends BaseEntity {
    tenant_id: string;
    channel_id: string;
    finding_id: string;
    channel_type: string;
    status: 'sent' | 'failed';
    error_message: string;
    response: any;
}
