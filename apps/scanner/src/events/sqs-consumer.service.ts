// apps/scanner/src/events/sqs-consumer.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';
import { SQSClient } from '@aws-sdk/client-sqs';
import { EventProcessorService } from './event-processor.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SqsConsumerService.name);
    private consumer: Consumer;
    private sqsClient: SQSClient;

    constructor(
        private configService: ConfigService,
        private eventProcessor: EventProcessorService,
    ) {
        this.sqsClient = new SQSClient({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
        });
    }

    onModuleInit() {
        const queueUrl = this.configService.get('AWS_SQS_QUEUE_URL');
        if (!queueUrl) {
            this.logger.warn('SQS_QUEUE_URL not set, event ingestion disabled');
            return;
        }

        this.consumer = Consumer.create({
            queueUrl,
            sqs: this.sqsClient,
            handleMessage: async (message) => {
                try {
                    const body = JSON.parse(message.Body);
                    this.logger.debug(`Received SQS message: ${message.MessageId}`);

                    // Handle SNS wrapped messages (EventBridge → SNS → SQS)
                    if (body.Type === 'Notification') {
                        const event = JSON.parse(body.Message);
                        await this.eventProcessor.processEvent(event);
                    } else {
                        // Direct EventBridge to SQS
                        await this.eventProcessor.processEvent(body);
                    }

                    // Message handled successfully, will be deleted from queue
                } catch (error) {
                    this.logger.error('Error processing SQS message', error);
                    // Throw error to prevent deletion; will be retried later
                    throw error;
                }
            },
            pollingWaitTimeMs: 20000, // 20 seconds long polling
            visibilityTimeout: 60, // 60 seconds
            batchSize: 10,
        });

        this.consumer.on('error', (err) => {
            this.logger.error('SQS consumer error', err);
        });

        this.consumer.on('processing_error', (err) => {
            this.logger.error('SQS processing error', err);
        });

        this.consumer.start();
        this.logger.log(`SQS consumer started for queue: ${queueUrl}`);
    }

    onModuleDestroy() {
        if (this.consumer) {
            this.consumer.stop();
            this.logger.log('SQS consumer stopped');
        }
    }
}