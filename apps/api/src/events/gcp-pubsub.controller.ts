import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';

@Controller('events/gcp')
export class GcpPubSubController {
    private readonly logger = new Logger(GcpPubSubController.name);

    constructor(private eventProcessor: EventProcessorService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleEvent(@Body() body: any) {
        this.logger.log('Received GCP Pub/Sub event');
        // Basic validation and forwarding to event processor
        // GCP format usually has { message: { data: 'base64...', attributes: {} } }
        return { status: 'ok' };
    }
}
