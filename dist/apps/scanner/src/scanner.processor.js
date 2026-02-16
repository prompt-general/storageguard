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
var ScannerProcessor_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const bull_2 = require("bull");
const scanner_service_1 = require("./scanner.service");
const database_1 = require("@storageguard/database");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let ScannerProcessor = ScannerProcessor_1 = class ScannerProcessor {
    constructor(scannerService, cloudAccountRepository) {
        this.scannerService = scannerService;
        this.cloudAccountRepository = cloudAccountRepository;
        this.logger = new common_1.Logger(ScannerProcessor_1.name);
    }
    async handleScanAccount(job) {
        this.logger.log(`Processing scan job for account: ${job.data.accountId}`);
        const account = await this.cloudAccountRepository.findOne({
            where: { id: job.data.accountId },
        });
        if (!account) {
            this.logger.error(`Account not found: ${job.data.accountId}`);
            return;
        }
        try {
            await this.scannerService.scanAccount(account);
            this.logger.log(`Successfully completed scan for account: ${account.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to scan account ${account.id}:`, error);
            throw error;
        }
    }
    async handleScanAll() {
        this.logger.log('Processing scan-all job');
        await this.scannerService.scanAllAccounts();
    }
};
exports.ScannerProcessor = ScannerProcessor;
__decorate([
    (0, bull_1.Process)('scan-account'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ScannerProcessor.prototype, "handleScanAccount", null);
__decorate([
    (0, bull_1.Process)('scan-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScannerProcessor.prototype, "handleScanAll", null);
exports.ScannerProcessor = ScannerProcessor = ScannerProcessor_1 = __decorate([
    (0, bull_1.Processor)('scanner'),
    __param(1, (0, typeorm_1.InjectRepository)(database_1.CloudAccount)),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService,
        typeorm_2.Repository])
], ScannerProcessor);
//# sourceMappingURL=scanner.processor.js.map