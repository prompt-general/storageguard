import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventProcessorService {
    private readonly logger = new Logger(EventProcessorService.name);

    async processAzureEvent(event: any) {
        this.logger.log(`Processing Azure event: ${event.eventType}`);
        // This will be implemented to forward to scanner or process directly
    }
}
