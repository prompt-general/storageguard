// apps/api/src/control/control.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Control } from '@storageguard/database';
import { ControlService } from './control.service';
import { ControlController } from './control.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Control])],
    providers: [ControlService],
    controllers: [ControlController],
    exports: [ControlService],
})
export class ControlModule { }