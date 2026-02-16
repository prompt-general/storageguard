import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageResource } from '@storageguard/database';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
    imports: [TypeOrmModule.forFeature([StorageResource])],
    controllers: [ResourcesController],
    providers: [ResourcesService],
    exports: [ResourcesService],
})
export class ResourcesModule { }
