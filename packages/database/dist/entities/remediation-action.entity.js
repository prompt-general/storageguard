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
exports.RemediationAction = exports.RemediationStatus = exports.RemediationActionType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const finding_entity_1 = require("./finding.entity");
var RemediationActionType;
(function (RemediationActionType) {
    RemediationActionType["REMOVE_PUBLIC_ACCESS"] = "remove_public_access";
    RemediationActionType["ENABLE_ENCRYPTION"] = "enable_encryption";
    RemediationActionType["ENABLE_VERSIONING"] = "enable_versioning";
    RemediationActionType["ENABLE_LOGGING"] = "enable_logging";
    RemediationActionType["UPDATE_POLICY"] = "update_policy";
})(RemediationActionType || (exports.RemediationActionType = RemediationActionType = {}));
var RemediationStatus;
(function (RemediationStatus) {
    RemediationStatus["PENDING"] = "pending";
    RemediationStatus["DRY_RUN_COMPLETED"] = "dry_run_completed";
    RemediationStatus["EXECUTED"] = "executed";
    RemediationStatus["FAILED"] = "failed";
    RemediationStatus["ROLLED_BACK"] = "rolled_back";
})(RemediationStatus || (exports.RemediationStatus = RemediationStatus = {}));
let RemediationAction = class RemediationAction extends base_entity_1.BaseEntity {
};
exports.RemediationAction = RemediationAction;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RemediationAction.prototype, "finding_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RemediationActionType,
    }),
    __metadata("design:type", String)
], RemediationAction.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RemediationStatus,
        default: RemediationStatus.PENDING,
    }),
    __metadata("design:type", String)
], RemediationAction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], RemediationAction.prototype, "parameters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RemediationAction.prototype, "previous_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RemediationAction.prototype, "new_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RemediationAction.prototype, "execution_result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RemediationAction.prototype, "executed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], RemediationAction.prototype, "executed_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => finding_entity_1.Finding, (finding) => finding.id),
    (0, typeorm_1.JoinColumn)({ name: 'finding_id' }),
    __metadata("design:type", finding_entity_1.Finding)
], RemediationAction.prototype, "finding", void 0);
exports.RemediationAction = RemediationAction = __decorate([
    (0, typeorm_1.Entity)('remediation_action')
], RemediationAction);
//# sourceMappingURL=remediation-action.entity.js.map