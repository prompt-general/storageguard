import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { EventProcessorService } from '@storageguard/scanner';

@Controller('events/gcp')
export class GcpPubSubController {
    private readonly logger = new Logger(GcpPubSubController.name);

    constructor(private eventProcessor: EventProcessorService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleMessage(@Body() body: any) {
        try {
            // Pub/Sub push messages are wrapped in a message object
            // {
            //   message: {
            //     data: string (base64),
            //     attributes: { ... },
            //     messageId: string
            //   },
            //   subscription: string
            // }
            const data = body.message?.data;
            if (!data) {
                this.logger.warn('Invalid Pub/Sub message: no data');
                return { error: 'Invalid message' };
            }

            // Decode base64
            const decoded = Buffer.from(data, 'base64').toString('utf-8');
            const event = JSON.parse(decoded);

            await this.eventProcessor.processGcpEvent(event);

            // Return 200 to acknowledge
            return { status: 'ok' };
        } catch (error) {
            this.logger.error('Error processing GCP Pub/Sub message', error);
            // Return 200 to prevent retry? Better to return 500 to trigger retry.
            throw error;
        }
    }
}
