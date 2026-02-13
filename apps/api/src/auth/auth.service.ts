import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async generateTestToken(tenantId: string, userId: string) {
        const payload = {
            sub: userId,
            tenant_id: tenantId,
            'https://storageguard.com/roles': ['admin'], // Default to admin for test tokens
        };
        return this.jwtService.sign(payload);
    }
}
