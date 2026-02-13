import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule, CloudAccount, StorageResource, Finding } from '@storageguard/database';
import { ScannerService } from './scanner.service';
import { ScannerProcessor } from './scanner.processor';
import { AwsProvider } from './providers/aws.provider';
import { SqsConsumerService } from './events/sqs-consumer.service';
import { EventProcessorService } from './events/event-processor.service';
import { FindingsModule } from '../../../api/src/control/findings/findings.module';
import { ControlModule } from '../../../api/src/control/control.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
        }),
        BullModule.registerQueue({
            name: 'scanner',
        }),
        DatabaseModule,
        TypeOrmModule.forFeature([CloudAccount, StorageResource, Finding]),
        FindingsModule,
        ControlModule,
    ],
    providers: [
        ScannerService,
        AwsProvider,
        ScannerProcessor,
        SqsConsumerService,
        EventProcessorService,
    ],
    exports: [ScannerService],
})
export class ScannerModule { }