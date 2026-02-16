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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudAccount = exports.CloudProvider = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const tenant_entity_1 = require("./tenant.entity");
const storage_resource_entity_1 = require("./storage-resource.entity");
var CloudProvider;
(function (CloudProvider) {
    CloudProvider["AWS"] = "aws";
    CloudProvider["AZURE"] = "azure";
    CloudProvider["GCP"] = "gcp";
})(CloudProvider || (exports.CloudProvider = CloudProvider = {}));
let CloudAccount = class CloudAccount extends base_entity_1.BaseEntity {
};
exports.CloudAccount = CloudAccount;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CloudAccount.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CloudProvider,
    }),
    __metadata("design:type", String)
], CloudAccount.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CloudAccount.prototype, "external_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CloudAccount.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CloudAccount.prototype, "credentials", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CloudAccount.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CloudAccount.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CloudAccount.prototype, "last_scanned_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, (tenant) => tenant.cloud_accounts),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], CloudAccount.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => storage_resource_entity_1.StorageResource, (resource) => resource.cloud_account),
    __metadata("design:type", Array)
], CloudAccount.prototype, "storage_resources", void 0);
exports.CloudAccount = CloudAccount = __decorate([
    (0, typeorm_1.Entity)('cloud_account')
], CloudAccount);
//# sourceMappingURL=cloud-account.entity.js.map