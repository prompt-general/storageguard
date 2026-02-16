import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageResource } from '@storageguard/database';
import { SensitivityController } from './sensitivity.controller';
import { SensitivityService } from './sensitivity.service';
import { ScannerModule } from '@storageguard/scanner';

@Module({
    imports: [
        TypeOrmModule.forFeature([StorageResource]),
        ScannerModule,
    ],
    controllers: [SensitivityController],
    providers: [SensitivityService],
})
export class SensitivityModule { }
