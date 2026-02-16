export interface CloudTrailEvent {
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: Array<{
        ARN: string;
        accountId: string;
        type: string;
    }>;
    detail: {
        eventSource: string;
        eventName: string;
        awsRegion: string;
        sourceIPAddress: string;
        userAgent: string;
        requestParameters: any;
        responseElements: any;
        requestID: string;
        eventID: string;
        readOnly: boolean;
        eventType: string;
        managementEvent: boolean;
        recipientAccountId: string;
        eventCategory: string;
    };
}
export interface NormalizedEvent {
    provider: 'aws';
    event_id: string;
    event_time: Date;
    resource_id: string;
    resource_type: 'bucket';
    account_id: string;
    region: string;
    event_name: string;
    changed_properties: string[];
    raw_event: any;
}
