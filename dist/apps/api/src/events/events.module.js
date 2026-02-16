"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const azure_event_controller_1 = require("./azure-event.controller");
const gcp_pubsub_controller_1 = require("./gcp-pubsub.controller");
const scanner_1 = require("@storageguard/scanner");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [scanner_1.ScannerModule],
        controllers: [azure_event_controller_1.AzureEventController, gcp_pubsub_controller_1.GcpPubSubController],
        providers: [],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map