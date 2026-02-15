import { Controller, Post, Headers, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { EventGridDeserializer } from '@azure/eventgrid';
import { EventProcessorService } from '@storageguard/scanner';


@Controller('events/azure')
export class AzureEventController {
    private readonly logger = new Logger(AzureEventController.name);
    private deserializer = new EventGridDeserializer();

    constructor(private eventProcessor: EventProcessorService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleEvent(
        @Headers('aeg-event-type') eventType: string,
        @Body() body: any,
    ) {
        // Validate that it's from Event Grid
        if (!eventType) {
            this.logger.warn('Received request without aeg-event-type header');
            return { error: 'Not an Event Grid message' };
        }

        try {
            // Deserialize events (handles batch)
            const events = await this.deserializer.deserializeEventGridEvents(body);

            for (const event of events) {
                await this.eventProcessor.processAzureEvent(event);
            }
        } catch (error) {
            this.logger.error('Error processing Azure event', error);
            // Return 200 to prevent retry storm, but log error
        }

        return { status: 'ok' };
    }
}
