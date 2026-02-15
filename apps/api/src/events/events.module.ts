import { Module } from '@nestjs/common';
import { AzureEventController } from './azure-event.controller';
import { GcpPubSubController } from './gcp-pubsub.controller';
import { ScannerModule, EventProcessorService } from '@storageguard/scanner';

@Module({
    imports: [ScannerModule],
    controllers: [AzureEventController, GcpPubSubController],
    providers: [],
})
export class EventsModule { }
