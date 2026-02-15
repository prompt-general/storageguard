import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@storageguard/database';
import { ControlModule } from './control/control.module';
import { FindingsModule } from './control/findings/findings.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthModule,
        ControlModule,
        FindingsModule,
        EventsModule,
    ],
})
export class AppModule { }