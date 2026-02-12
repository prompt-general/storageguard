// apps/scanner/src/scanner.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@storageguard/database';
import { ScannerService } from './scanner.service';
import { AwsProvider } from './providers/aws.provider';
import { FindingsModule } from '../../../api/src/control/findings/findings.module';
import { ControlModule } from '../../../api/src/control/control.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        DatabaseModule,
        TypeOrmModule.forFeature([]),
        FindingsModule,
        ControlModule,
    ],
    providers: [ScannerService, AwsProvider],
    exports: [ScannerService],
})
export class ScannerModule { }