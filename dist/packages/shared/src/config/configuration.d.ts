export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    tls?: boolean;
}
export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    oidc?: {
        issuer: string;
        clientId: string;
        clientSecret: string;
    };
}
export interface AwsConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
export interface AppConfig {
    environment: 'development' | 'production' | 'test';
    port: number;
    database: DatabaseConfig;
    redis: RedisConfig;
    auth: AuthConfig;
    aws: AwsConfig;
    encryptionKey: string;
}
export declare const configuration: () => AppConfig;
