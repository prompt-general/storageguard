// packages/database/src/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_DATABASE || 'storageguard',
                entities: Object.values(entities),
                synchronize: process.env.NODE_ENV === 'development',
                logging: process.env.NODE_ENV === 'development',
                migrations: ['dist/migrations/*.js'],
                migrationsRun: true,
            }),
        }),
        TypeOrmModule.forFeature(Object.values(entities)),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }