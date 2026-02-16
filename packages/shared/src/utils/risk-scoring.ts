import { FindingSeverity } from '@storageguard/database';

export interface RiskScoreFactors {

    baseSeverity: FindingSeverity;
    isInternetAccessible: boolean;
    isAuthenticatedUsersOnly: boolean;
    businessCriticality?: number; // 0.5 - 2.0 multiplier, default 1.0
    containsSensitiveData?: boolean;
    sensitiveDataTypes?: string[];
}


export class RiskScoringEngine {
    private severityWeights: Record<FindingSeverity, number> = {
        'info': 10,
        'low': 25,
        'medium': 50,
        'high': 75,
        'critical': 100
    };

    calculateRiskScore(factors: RiskScoreFactors): number {
        // Base score from severity
        let score = this.severityWeights[factors.baseSeverity];

        // Exposure multiplier
        let exposureMultiplier = 1.0;
        if (factors.isInternetAccessible) {
            exposureMultiplier = 1.5;
        } else if (factors.isAuthenticatedUsersOnly) {
            exposureMultiplier = 1.2;
        }

        // Sensitivity multiplier
        let sensitivityMultiplier = 1.0;
        if (factors.containsSensitiveData) {
            // Increase risk based on types: PII might be 1.3, credentials 1.5, etc.
            const maxSensitivity = factors.sensitiveDataTypes?.reduce((max, type) => {
                const multipliers: { [key: string]: number } = {
                    pii: 1.3,
                    credential: 1.5,
                    financial: 1.4,
                };
                const mult = multipliers[type] || 1.2;
                return Math.max(max, mult);
            }, 1.2) || 1.2;
            sensitivityMultiplier = maxSensitivity;
        }

        // Business criticality multiplier (default 1.0)
        const criticalityMultiplier = factors.businessCriticality || 1.0;

        // Calculate final score (0-100)
        let finalScore = score * exposureMultiplier * sensitivityMultiplier * criticalityMultiplier;

        // Cap at 100
        return Math.min(Math.round(finalScore), 100);
    }



    // Phase 1: Simple exposure detection
    detectExposure(policy: any, configuration: any): {
        isInternetAccessible: boolean;
        isAuthenticatedUsersOnly: boolean;
    } {
        // Default to safe values
        const result = {
            isInternetAccessible: false,
            isAuthenticatedUsersOnly: false
        };

        // Check for wildcard principals
        if (policy) {
            const policyStr = JSON.stringify(policy).toLowerCase();

            // Check for internet accessibility (wildcard principals)
            if (policyStr.includes('"principal":"*"') ||
                policyStr.includes('"principal":{"aws":"*"}')) {
                result.isInternetAccessible = true;
            }

            // Check for authenticated users (any principal that's not wildcard)
            if (policyStr.includes('"principal"') && !result.isInternetAccessible) {
                result.isAuthenticatedUsersOnly = true;
            }
        }

        // Check bucket/container ACLs for public access
        if (configuration?.public_access === true) {
            result.isInternetAccessible = true;
        }

        return result;
    }
}