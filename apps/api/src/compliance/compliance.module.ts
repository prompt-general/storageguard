import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Control, Finding, StorageResource } from '@storageguard/database';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Control, Finding, StorageResource]),
    ],
    providers: [ComplianceService],
    controllers: [ComplianceController],
})
export class ComplianceModule { }
