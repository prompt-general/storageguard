import { Module } from '@nestjs/common';
import { AzureEventController } from './azure-event.controller';
import { GcpPubSubController } from './gcp-pubsub.controller';
import { EventProcessorService } from './event-processor.service';
import { ScannerModule } from '@storageguard/scanner'; // We'll need to expose EventProcessor from scanner or move it to shared

@Module({
    imports: [ScannerModule], // So we can use EventProcessorService from scanner
    controllers: [AzureEventController, GcpPubSubController],
    providers: [EventProcessorService],
})
export class EventsModule { }
