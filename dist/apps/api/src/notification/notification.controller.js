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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_decorator_1 = require("../auth/decorators/tenant.decorator");
const database_1 = require("@storageguard/database");
const notification_service_1 = require("./notification.service");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getChannels(tenantId) {
        return this.notificationService.getChannels(tenantId);
    }
    async createChannel(tenantId, data) {
        data.tenant_id = tenantId;
        return this.notificationService.createChannel(data);
    }
    async updateChannel(id, data) {
        return this.notificationService.updateChannel(id, data);
    }
    async deleteChannel(id) {
        await this.notificationService.deleteChannel(id);
        return { success: true };
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)('channels'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.SECURITY_ENGINEER),
    (0, swagger_1.ApiOperation)({ summary: 'List notification channels' }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getChannels", null);
__decorate([
    (0, common_1.Post)('channels'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create notification channel' }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Put)('channels/:id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification channel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateChannel", null);
__decorate([
    (0, common_1.Delete)('channels/:id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete notification channel' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteChannel", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map