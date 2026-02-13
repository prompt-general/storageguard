// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('test-token')
    async getTestToken(@Body() body: { tenantId: string; userId: string }) {
        // For development only! Remove in production.
        const token = await this.authService.generateTestToken(body.tenantId, body.userId);
        return { access_token: token };
    }
}