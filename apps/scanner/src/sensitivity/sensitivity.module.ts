import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageResource, CloudAccount } from '@storageguard/database';
import { SensitivityScannerService } from './sensitivity-scanner.service';
import { AwsProvider } from '../providers/aws.provider';
import { AzureProvider } from '../providers/azure.provider';
import { GcpProvider } from '../providers/gcp.provider';

@Module({
    imports: [TypeOrmModule.forFeature([StorageResource, CloudAccount])],
    providers: [SensitivityScannerService, AwsProvider, AzureProvider, GcpProvider],
    exports: [SensitivityScannerService],
})
export class SensitivityModule { }
