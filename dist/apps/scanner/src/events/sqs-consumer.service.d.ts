import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventProcessorService } from './event-processor.service';
export declare class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private eventProcessor;
    private readonly logger;
    private consumer;
    private sqsClient;
    constructor(configService: ConfigService, eventProcessor: EventProcessorService);
    onModuleInit(): void;
    onModuleDestroy(): void;
}
