import { EventProcessorService } from '@storageguard/scanner';
export declare class AzureEventController {
    private eventProcessor;
    private readonly logger;
    private deserializer;
    constructor(eventProcessor: EventProcessorService);
    handleEvent(eventType: string, body: any): Promise<{
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    }>;
}
