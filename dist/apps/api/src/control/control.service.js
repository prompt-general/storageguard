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
var ControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_1 = require("@storageguard/database");
let ControlService = ControlService_1 = class ControlService {
    constructor(controlRepository) {
        this.controlRepository = controlRepository;
        this.logger = new common_1.Logger(ControlService_1.name);
    }
    async findAll() {
        return this.controlRepository.find();
    }
    async findById(id) {
        return this.controlRepository.findOne({ where: { id } });
    }
    async getBaseSeverity(controlId) {
        const control = await this.findById(controlId);
        return control?.base_severity || database_1.FindingSeverity.MEDIUM;
    }
    async getRemediationGuidance(controlId) {
        const control = await this.findById(controlId);
        const guidanceMap = {
            'SG-001': 'Block public access at bucket and account level.',
            'SG-002': 'Enable default encryption using SSE-S3 or KMS.',
            'SG-003': 'Enable access logging and deliver logs to a separate bucket.',
            'SG-004': 'Enable versioning or soft delete to protect against accidental deletion.',
            'SG-005': 'Review bucket policies and remove wildcard principals or actions.',
        };
        return guidanceMap[controlId] || 'No remediation guidance available.';
    }
    async isRemediationAvailable(controlId) {
        const remediableControls = ['SG-001', 'SG-002', 'SG-003', 'SG-004', 'SG-005'];
        return remediableControls.includes(controlId);
    }
};
exports.ControlService = ControlService;
exports.ControlService = ControlService = ControlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(database_1.Control)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ControlService);
//# sourceMappingURL=control.service.js.map