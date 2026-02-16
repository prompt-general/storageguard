"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities = require("./entities");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
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
            typeorm_1.TypeOrmModule.forFeature(Object.values(entities)),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map