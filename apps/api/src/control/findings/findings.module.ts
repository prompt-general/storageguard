// apps/api/src/findings/findings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finding, StorageResource } from '@storageguard/database';
import { FindingsService } from './findings.service';
import { FindingsController } from './findings.controller';
import { ControlModule } from '../control.module';
import { NotificationModule } from '../../notification/notification.module';


@Module({
    imports: [
        TypeOrmModule.forFeature([Finding, StorageResource]),
        ControlModule,
        NotificationModule,
    ],

    providers: [FindingsService],
    controllers: [FindingsController],
    exports: [FindingsService],
})
export class FindingsModule { }