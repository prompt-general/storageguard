import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@storageguard/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${configService.get<string>('AUTH0_ISSUER_URL')}.well-known/jwks.json`,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: configService.get<string>('AUTH0_AUDIENCE'),
            issuer: configService.get<string>('AUTH0_ISSUER_URL'),
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        const auth0Id = payload.sub;
        const user = await this.userRepository.findOne({
            where: { auth0_id: auth0Id, is_active: true },
            relations: ['tenant'],
        });

        if (!user) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }
}
