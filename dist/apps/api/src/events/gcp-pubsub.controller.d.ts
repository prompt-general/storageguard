import { EventProcessorService } from '@storageguard/scanner';
export declare class GcpPubSubController {
    private eventProcessor;
    private readonly logger;
    constructor(eventProcessor: EventProcessorService);
    handleMessage(body: any): Promise<{
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    }>;
}
