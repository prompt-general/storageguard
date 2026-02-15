import { Module } from '@nestjs/common';
import { AzureEventController } from './azure-event.controller';
import { EventProcessorService } from './event-processor.service';

@Module({
    controllers: [AzureEventController],
    providers: [EventProcessorService],
    exports: [EventProcessorService],
})
export class EventsModule { }
