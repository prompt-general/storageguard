import { Repository } from 'typeorm';
import { Control, FindingSeverity } from '@storageguard/database';
export declare class ControlService {
    private controlRepository;
    private readonly logger;
    constructor(controlRepository: Repository<Control>);
    findAll(): Promise<Control[]>;
    findById(id: string): Promise<Control | null>;
    getBaseSeverity(controlId: string): Promise<FindingSeverity>;
    getRemediationGuidance(controlId: string): Promise<string | null>;
    isRemediationAvailable(controlId: string): Promise<boolean>;
}
