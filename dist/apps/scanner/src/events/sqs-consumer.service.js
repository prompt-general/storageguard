"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SqsConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsConsumerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sqs_consumer_1 = require("sqs-consumer");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const event_processor_service_1 = require("./event-processor.service");
let SqsConsumerService = SqsConsumerService_1 = class SqsConsumerService {
    constructor(configService, eventProcessor) {
        this.configService = configService;
        this.eventProcessor = eventProcessor;
        this.logger = new common_1.Logger(SqsConsumerService_1.name);
        this.sqsClient = new client_sqs_1.SQSClient({
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
        this.consumer = sqs_consumer_1.Consumer.create({
            queueUrl,
            sqs: this.sqsClient,
            handleMessage: async (message) => {
                try {
                    const body = JSON.parse(message.Body);
                    this.logger.debug(`Received SQS message: ${message.MessageId}`);
                    if (body.Type === 'Notification') {
                        const event = JSON.parse(body.Message);
                        await this.eventProcessor.processEvent(event);
                    }
                    else {
                        await this.eventProcessor.processEvent(body);
                    }
                }
                catch (error) {
                    this.logger.error('Error processing SQS message', error);
                    throw error;
                }
            },
            pollingWaitTimeMs: 20000,
            visibilityTimeout: 60,
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
};
exports.SqsConsumerService = SqsConsumerService;
exports.SqsConsumerService = SqsConsumerService = SqsConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        event_processor_service_1.EventProcessorService])
], SqsConsumerService);
//# sourceMappingURL=sqs-consumer.service.js.map