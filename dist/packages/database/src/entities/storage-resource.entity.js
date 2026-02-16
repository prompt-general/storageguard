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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageResource = exports.ResourceType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const cloud_account_entity_1 = require("./cloud-account.entity");
const finding_entity_1 = require("./finding.entity");
var ResourceType;
(function (ResourceType) {
    ResourceType["BUCKET"] = "bucket";
    ResourceType["CONTAINER"] = "container";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
let StorageResource = class StorageResource extends base_entity_1.BaseEntity {
};
exports.StorageResource = StorageResource;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StorageResource.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StorageResource.prototype, "account_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CloudProvider,
    }),
    __metadata("design:type", typeof (_a = typeof CloudProvider !== "undefined" && CloudProvider) === "function" ? _a : Object)
], StorageResource.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ResourceType,
    }),
    __metadata("design:type", String)
], StorageResource.prototype, "resource_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], StorageResource.prototype, "resource_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], StorageResource.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], StorageResource.prototype, "configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StorageResource.prototype, "discovered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], StorageResource.prototype, "last_modified_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cloud_account_entity_1.CloudAccount, (account) => account.storage_resources),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", cloud_account_entity_1.CloudAccount)
], StorageResource.prototype, "cloud_account", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => finding_entity_1.Finding, (finding) => finding.storage_resource),
    __metadata("design:type", Array)
], StorageResource.prototype, "findings", void 0);
exports.StorageResource = StorageResource = __decorate([
    (0, typeorm_1.Entity)('storage_resource'),
    (0, typeorm_1.Index)(['tenant_id', 'provider', 'account_id']),
    (0, typeorm_1.Index)(['tenant_id', 'resource_id', 'provider'], { unique: true })
], StorageResource);
//# sourceMappingURL=storage-resource.entity.js.map