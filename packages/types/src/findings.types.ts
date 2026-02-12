// packages/types/src/findings.types.ts
export interface Finding {
    id: string;
    tenant_id: string;
    resource_id: string;
    control_id: string;
    severity: FindingSeverity;
    risk_score: number;
    status: FindingStatus;
    title: string;
    description: string;
    evidence: Record<string, any>;
    remediation_available: boolean;
    remediation_guidance?: string;
    detected_at: Date;
    resolved_at?: Date;
    last_seen_at: Date;
}

export interface Control {
    id: string;
    name: string;
    description: string;
    base_severity: FindingSeverity;
    provider_specific?: {
        aws?: { service: string; check_type: string };
        azure?: { resource_type: string; check_type: string };
        gcp?: { service: string; check_type: string };
    };
    compliance_mapping?: {
        cis?: string[];
        soc2?: string[];
        iso27001?: string[];
        nist?: string[];
    };
}

export interface RemediationAction {
    id: string;
    finding_id: string;
    action_type: string;
    status: string;
    parameters: Record<string, any>;
    previous_state?: Record<string, any>;
    new_state?: Record<string, any>;
    execution_result?: Record<string, any>;
    executed_at?: Date;
    executed_by?: string;
}