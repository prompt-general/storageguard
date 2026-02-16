"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const entities = require("./entities");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'storageguard',
    entities: Object.values(entities).filter(val => typeof val === 'function'),
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
});
//# sourceMappingURL=datasource.js.map