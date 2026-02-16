"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = void 0;
const configuration = () => ({
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'storageguard',
        ssl: process.env.DB_SSL === 'true',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    encryptionKey: process.env.ENCRYPTION_KEY || 'development-encryption-key-change-in-production',
});
exports.configuration = configuration;
//# sourceMappingURL=configuration.js.map