import { BaseEntity } from './base.entity';
import { FindingSeverity } from './finding.entity';
export declare class Control extends BaseEntity {
    id: string;
    name: string;
    description: string;
    base_severity: FindingSeverity;
    provider_specific: {
        aws?: {
            service: string;
            check_type: string;
        };
        azure?: {
            resource_type: string;
            check_type: string;
        };
        gcp?: {
            service: string;
            check_type: string;
        };
    };
    compliance_mapping: {
        cis?: string[];
        soc2?: string[];
        iso27001?: string[];
        nist?: string[];
    };
}
