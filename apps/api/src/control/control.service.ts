// apps/api/src/control/control.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Control, FindingSeverity } from '@storageguard/database';

@Injectable()
export class ControlService {
    private readonly logger = new Logger(ControlService.name);

    constructor(
        @InjectRepository(Control)
        private controlRepository: Repository<Control>,
    ) { }

    async findAll(): Promise<Control[]> {
        return this.controlRepository.find();
    }

    async findById(id: string): Promise<Control | null> {
        return this.controlRepository.findOne({ where: { id } });
    }

    async getBaseSeverity(controlId: string): Promise<FindingSeverity> {
        const control = await this.findById(controlId);
        return control?.base_severity || FindingSeverity.MEDIUM;
    }

    async getRemediationGuidance(controlId: string): Promise<string | null> {
        const control = await this.findById(controlId);
        // In the future, store remediation guidance in control entity
        // For now, return default guidance
        const guidanceMap = {
            'SG-001': 'Block public access at bucket and account level.',
            'SG-002': 'Enable default encryption using SSE-S3 or KMS.',
            'SG-003': 'Enable access logging and deliver logs to a separate bucket.',
            'SG-004': 'Enable versioning or soft delete to protect against accidental deletion.',
            'SG-005': 'Review bucket policies and remove wildcard principals or actions.',
        };
        return guidanceMap[controlId] || 'No remediation guidance available.';
    }

    async isRemediationAvailable(controlId: string): Promise<boolean> {
        const remediableControls = ['SG-001', 'SG-002', 'SG-003', 'SG-004', 'SG-005'];
        return remediableControls.includes(controlId);
    }
}