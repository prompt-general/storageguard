import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finding, RemediationAction, StorageResource, CloudAccount } from '@storageguard/database';
import { RemediationService } from './remediation.service';
import { RemediationController } from './remediation.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Finding,
            RemediationAction,
            StorageResource,
            CloudAccount
        ])
    ],
    controllers: [RemediationController],
    providers: [RemediationService],
    exports: [RemediationService],
})
export class RemediationModule { }
