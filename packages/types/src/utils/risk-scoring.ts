// packages/shared/src/utils/risk-scoring.ts
import { FindingSeverity } from '@storageguard/types';

export interface RiskScoreFactors {
    baseSeverity: FindingSeverity;
    isInternetAccessible: boolean;
    isAuthenticatedUsersOnly: boolean;
    businessCriticality?: number; // 0.5 - 2.0 multiplier
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
            exposureMultiplier = 1.5; // 50% increase for internet-accessible
        } else if (factors.isAuthenticatedUsersOnly) {
            exposureMultiplier = 1.2; // 20% increase for authenticated users
        }

        // Business criticality multiplier
        const criticalityMultiplier = factors.businessCriticality || 1.0;

        // Calculate final score (0-100)
        let finalScore = score * exposureMultiplier * criticalityMultiplier;

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