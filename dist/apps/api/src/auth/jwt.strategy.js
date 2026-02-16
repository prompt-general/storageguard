"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const jwks_rsa_1 = require("jwks-rsa");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_1 = require("@storageguard/database");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, userRepository) {
        super({
            secretOrKeyProvider: (0, jwks_rsa_1.passportJwtSecret)({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${configService.get('AUTH0_ISSUER_URL')}.well-known/jwks.json`,
            }),
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: configService.get('AUTH0_AUDIENCE'),
            issuer: configService.get('AUTH0_ISSUER_URL'),
            algorithms: ['RS256'],
        });
        this.configService = configService;
        this.userRepository = userRepository;
    }
    async validate(payload) {
        const auth0Id = payload.sub;
        const user = await this.userRepository.findOne({
            where: { auth0_id: auth0Id, is_active: true },
            relations: ['tenant'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(database_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map