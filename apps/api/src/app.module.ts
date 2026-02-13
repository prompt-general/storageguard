// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@storageguard/database';
import { ControlModule } from './control/control.module';
import { FindingsModule } from './control/findings/findings.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        ControlModule,
        FindingsModule,
    ],
})
export class AppModule { }