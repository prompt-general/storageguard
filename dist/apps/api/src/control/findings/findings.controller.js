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
exports.FindingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const tenant_decorator_1 = require("../../auth/decorators/tenant.decorator");
const database_1 = require("@storageguard/database");
const findings_service_1 = require("./findings.service");
const create_finding_dto_1 = require("./dto/create-finding.dto");
const update_finding_dto_1 = require("./dto/update-finding.dto");
let FindingsController = class FindingsController {
    constructor(findingsService) {
        this.findingsService = findingsService;
    }
    create(createFindingDto, tenantId) {
        createFindingDto.tenant_id = tenantId;
        return this.findingsService.create(createFindingDto);
    }
    async findAll(tenantId, status, severity, resource_id, limit, offset) {
        return this.findingsService.findAllForTenant(tenantId, {
            status, severity, resource_id, limit, offset,
        });
    }
    async getStatistics(tenantId) {
        return this.findingsService.getStatistics(tenantId);
    }
    findOne(id, tenantId) {
        return this.findingsService.findOne(id);
    }
    update(id, updateFindingDto, tenantId) {
        return this.findingsService.update(id, updateFindingDto);
    }
    suppress(id, reason, tenantId) {
        return this.findingsService.suppress(id, reason);
    }
    resolve(id, tenantId) {
        return this.findingsService.resolve(id);
    }
};
exports.FindingsController = FindingsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new finding (internal use)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_finding_dto_1.CreateFindingDto, String]),
    __metadata("design:returntype", void 0)
], FindingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER, database_1.UserRole.PLATFORM_ENGINEER, database_1.UserRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'List findings for current tenant' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'severity', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'resource_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('severity')),
    __param(3, (0, common_1.Query)('resource_id')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER, database_1.UserRole.PLATFORM_ENGINEER, database_1.UserRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Get findings statistics' }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER, database_1.UserRole.PLATFORM_ENGINEER, database_1.UserRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Get finding by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FindingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER),
    (0, swagger_1.ApiOperation)({ summary: 'Update finding' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_finding_dto_1.UpdateFindingDto, String]),
    __metadata("design:returntype", void 0)
], FindingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/suppress'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER),
    (0, swagger_1.ApiOperation)({ summary: 'Suppress finding' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], FindingsController.prototype, "suppress", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve finding' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FindingsController.prototype, "resolve", null);
exports.FindingsController = FindingsController = __decorate([
    (0, swagger_1.ApiTags)('findings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('findings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [findings_service_1.FindingsService])
], FindingsController);
//# sourceMappingURL=findings.controller.js.map