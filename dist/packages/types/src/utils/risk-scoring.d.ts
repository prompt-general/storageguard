import { FindingSeverity } from '@storageguard/types';
export interface RiskScoreFactors {
    baseSeverity: FindingSeverity;
    isInternetAccessible: boolean;
    isAuthenticatedUsersOnly: boolean;
    businessCriticality?: number;
}
export declare class RiskScoringEngine {
    private severityWeights;
    calculateRiskScore(factors: RiskScoreFactors): number;
    detectExposure(policy: any, configuration: any): {
        isInternetAccessible: boolean;
        isAuthenticatedUsersOnly: boolean;
    };
}
