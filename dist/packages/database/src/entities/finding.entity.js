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
exports.Finding = exports.FindingStatus = exports.FindingSeverity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const storage_resource_entity_1 = require("./storage-resource.entity");
var FindingSeverity;
(function (FindingSeverity) {
    FindingSeverity["INFO"] = "info";
    FindingSeverity["LOW"] = "low";
    FindingSeverity["MEDIUM"] = "medium";
    FindingSeverity["HIGH"] = "high";
    FindingSeverity["CRITICAL"] = "critical";
})(FindingSeverity || (exports.FindingSeverity = FindingSeverity = {}));
var FindingStatus;
(function (FindingStatus) {
    FindingStatus["OPEN"] = "open";
    FindingStatus["RESOLVED"] = "resolved";
    FindingStatus["SUPPRESSED"] = "suppressed";
    FindingStatus["FIXED"] = "fixed";
})(FindingStatus || (exports.FindingStatus = FindingStatus = {}));
let Finding = class Finding extends base_entity_1.BaseEntity {
};
exports.Finding = Finding;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Finding.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Finding.prototype, "resource_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Finding.prototype, "control_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FindingSeverity,
    }),
    __metadata("design:type", String)
], Finding.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], Finding.prototype, "risk_score", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FindingStatus,
        default: FindingStatus.OPEN,
    }),
    __metadata("design:type", String)
], Finding.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Finding.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Finding.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Finding.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Finding.prototype, "remediation_available", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Finding.prototype, "remediation_guidance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Finding.prototype, "detected_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Finding.prototype, "resolved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Finding.prototype, "last_seen_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => storage_resource_entity_1.StorageResource, (resource) => resource.findings),
    (0, typeorm_1.JoinColumn)({ name: 'resource_id' }),
    __metadata("design:type", storage_resource_entity_1.StorageResource)
], Finding.prototype, "storage_resource", void 0);
exports.Finding = Finding = __decorate([
    (0, typeorm_1.Entity)('finding'),
    (0, typeorm_1.Index)(['tenant_id', 'status']),
    (0, typeorm_1.Index)(['resource_id', 'control_id'], { unique: true }),
    (0, typeorm_1.Index)(['detected_at'])
], Finding);
//# sourceMappingURL=finding.entity.js.map