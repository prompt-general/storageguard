import { FindingSeverity } from '@storageguard/types';
export declare class CreateFindingDto {
    tenant_id: string;
    resource_id: string;
    control_id: string;
    severity: FindingSeverity;
    risk_score: number;
    title: string;
    description: string;
    evidence: Record<string, any>;
    remediation_available?: boolean;
    remediation_guidance?: string;
}
