import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finding, RemediationAction, StorageResource, CloudAccount } from '@storageguard/database';
import { RemediationService } from './remediation.service';
import { RemediationController } from './remediation.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Finding, RemediationAction, StorageResource, CloudAccount]),
    ],
    providers: [RemediationService],
    controllers: [RemediationController],
})
export class RemediationModule { }
