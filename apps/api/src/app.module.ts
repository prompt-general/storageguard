import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@storageguard/database';
import { ControlModule } from './control/control.module';
import { FindingsModule } from './control/findings/findings.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { NotificationModule } from './notification/notification.module';
import { ResourcesModule } from './resources/resources.module';
import { RemediationModule } from './remediation/remediation.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SensitivityModule } from './sensitivity/sensitivity.module';
import { CiModule } from './ci/ci.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthModule,
        ControlModule,
        FindingsModule,
        EventsModule,
        NotificationModule,
        ResourcesModule,
        RemediationModule,
        ComplianceModule,
        SensitivityModule,
        CiModule,
    ],


})



export class AppModule { }