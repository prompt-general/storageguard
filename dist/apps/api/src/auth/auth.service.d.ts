import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    generateTestToken(tenantId: string, userId: string): Promise<any>;
}
