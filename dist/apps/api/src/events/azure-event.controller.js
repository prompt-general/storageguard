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
var AzureEventController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureEventController = void 0;
const common_1 = require("@nestjs/common");
const eventgrid_1 = require("@azure/eventgrid");
const scanner_1 = require("@storageguard/scanner");
let AzureEventController = AzureEventController_1 = class AzureEventController {
    constructor(eventProcessor) {
        this.eventProcessor = eventProcessor;
        this.logger = new common_1.Logger(AzureEventController_1.name);
        this.deserializer = new eventgrid_1.EventGridDeserializer();
    }
    async handleEvent(eventType, body) {
        if (!eventType) {
            this.logger.warn('Received request without aeg-event-type header');
            return { error: 'Not an Event Grid message' };
        }
        try {
            const events = await this.deserializer.deserializeEventGridEvents(body);
            for (const event of events) {
                await this.eventProcessor.processAzureEvent(event);
            }
        }
        catch (error) {
            this.logger.error('Error processing Azure event', error);
        }
        return { status: 'ok' };
    }
};
exports.AzureEventController = AzureEventController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('aeg-event-type')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AzureEventController.prototype, "handleEvent", null);
exports.AzureEventController = AzureEventController = AzureEventController_1 = __decorate([
    (0, common_1.Controller)('events/azure'),
    __metadata("design:paramtypes", [typeof (_a = typeof scanner_1.EventProcessorService !== "undefined" && scanner_1.EventProcessorService) === "function" ? _a : Object])
], AzureEventController);
//# sourceMappingURL=azure-event.controller.js.map