import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '@storageguard/database';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private userRepository;
    constructor(configService: ConfigService, userRepository: Repository<User>);
    validate(payload: any): Promise<any>;
}
export {};
