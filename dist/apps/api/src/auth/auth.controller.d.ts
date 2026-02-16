import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    getTestToken(body: {
        tenantId: string;
        userId: string;
    }): Promise<{
        access_token: any;
    }>;
}
