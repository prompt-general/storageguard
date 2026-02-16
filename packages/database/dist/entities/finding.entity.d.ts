import { BaseEntity } from './base.entity';
import { StorageResource } from './storage-resource.entity';
export declare enum FindingSeverity {
    INFO = "info",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum FindingStatus {
    OPEN = "open",
    RESOLVED = "resolved",
    SUPPRESSED = "suppressed",
    FIXED = "fixed"
}
export declare class Finding extends BaseEntity {
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
    remediation_guidance: string;
    detected_at: Date;
    resolved_at: Date;
    last_seen_at: Date;
    storage_resource: StorageResource;
}
