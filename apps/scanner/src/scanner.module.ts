// apps/scanner/src/scanner.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@storageguard/database';
import { ScannerService } from './scanner.service';
import { AwsProvider } from './providers/aws.provider';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        DatabaseModule,
        TypeOrmModule.forFeature([]), // Entities are already in DatabaseModule
    ],
    providers: [ScannerService, AwsProvider],
    exports: [ScannerService],
})
export class ScannerModule { }