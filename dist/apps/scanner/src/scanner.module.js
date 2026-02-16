"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const database_1 = require("@storageguard/database");
const scanner_service_1 = require("./scanner.service");
const scanner_processor_1 = require("./scanner.processor");
const aws_provider_1 = require("./providers/aws.provider");
const sqs_consumer_service_1 = require("./events/sqs-consumer.service");
const event_processor_service_1 = require("./events/event-processor.service");
const azure_provider_1 = require("./providers/azure.provider");
const gcp_provider_1 = require("./providers/gcp.provider");
const findings_module_1 = require("../../../api/src/control/findings/findings.module");
const control_module_1 = require("../../../api/src/control/control.module");
let ScannerModule = class ScannerModule {
};
exports.ScannerModule = ScannerModule;
exports.ScannerModule = ScannerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'scanner',
            }),
            database_1.DatabaseModule,
            typeorm_1.TypeOrmModule.forFeature([database_1.CloudAccount, database_1.StorageResource, database_1.Finding]),
            findings_module_1.FindingsModule,
            control_module_1.ControlModule,
        ],
        providers: [
            scanner_service_1.ScannerService,
            aws_provider_1.AwsProvider,
            scanner_processor_1.ScannerProcessor,
            sqs_consumer_service_1.SqsConsumerService,
            event_processor_service_1.EventProcessorService,
            azure_provider_1.AzureProvider,
            gcp_provider_1.GcpProvider,
        ],
        exports: [scanner_service_1.ScannerService, event_processor_service_1.EventProcessorService],
    })
], ScannerModule);
//# sourceMappingURL=scanner.module.js.map