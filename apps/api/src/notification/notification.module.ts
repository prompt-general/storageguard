import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationChannel, NotificationLog } from '@storageguard/database';


@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([NotificationChannel, NotificationLog]),
    ],
    providers: [NotificationService],
    controllers: [NotificationController],
    exports: [NotificationService],
})
export class NotificationModule { }
