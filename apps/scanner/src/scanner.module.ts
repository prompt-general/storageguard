// apps/scanner/src/scanner.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
    DatabaseModule,
    CloudAccount,
    StorageResource,
    Finding,
} from '@storageguard/database';
import { ScannerService } from './scanner.service';
import { ScannerProcessor } from './scanner.processor';
import { AwsProvider } from './providers/aws.provider';
import { FindingsModule } from '../../../api/src/control/findings/findings.module';
import { ControlModule } from '../../../api/src/control/control.module';

@Module({
    imports: [
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
        TypeOrmModule.forFeature([CloudAccount]),
        FindingsModule,
        ControlModule,
    ],
    providers: [ScannerService, AwsProvider, ScannerProcessor],
    exports: [ScannerService],
})
export class ScannerModule { }