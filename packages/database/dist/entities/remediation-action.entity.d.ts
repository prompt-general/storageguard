import { BaseEntity } from './base.entity';
import { Finding } from './finding.entity';
export declare enum RemediationActionType {
    REMOVE_PUBLIC_ACCESS = "remove_public_access",
    ENABLE_ENCRYPTION = "enable_encryption",
    ENABLE_VERSIONING = "enable_versioning",
    ENABLE_LOGGING = "enable_logging",
    UPDATE_POLICY = "update_policy"
}
export declare enum RemediationStatus {
    PENDING = "pending",
    DRY_RUN_COMPLETED = "dry_run_completed",
    EXECUTED = "executed",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back"
}
export declare class RemediationAction extends BaseEntity {
    finding_id: string;
    action_type: RemediationActionType;
    status: RemediationStatus;
    parameters: Record<string, any>;
    previous_state: Record<string, any>;
    new_state: Record<string, any>;
    execution_result: Record<string, any>;
    executed_at: Date;
    executed_by: string;
    finding: Finding;
}
