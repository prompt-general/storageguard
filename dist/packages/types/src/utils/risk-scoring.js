"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScoringEngine = void 0;
class RiskScoringEngine {
    constructor() {
        this.severityWeights = {
            'info': 10,
            'low': 25,
            'medium': 50,
            'high': 75,
            'critical': 100
        };
    }
    calculateRiskScore(factors) {
        let score = this.severityWeights[factors.baseSeverity];
        let exposureMultiplier = 1.0;
        if (factors.isInternetAccessible) {
            exposureMultiplier = 1.5;
        }
        else if (factors.isAuthenticatedUsersOnly) {
            exposureMultiplier = 1.2;
        }
        const criticalityMultiplier = factors.businessCriticality || 1.0;
        let finalScore = score * exposureMultiplier * criticalityMultiplier;
        return Math.min(Math.round(finalScore), 100);
    }
    detectExposure(policy, configuration) {
        const result = {
            isInternetAccessible: false,
            isAuthenticatedUsersOnly: false
        };
        if (policy) {
            const policyStr = JSON.stringify(policy).toLowerCase();
            if (policyStr.includes('"principal":"*"') ||
                policyStr.includes('"principal":{"aws":"*"}')) {
                result.isInternetAccessible = true;
            }
            if (policyStr.includes('"principal"') && !result.isInternetAccessible) {
                result.isAuthenticatedUsersOnly = true;
            }
        }
        if (configuration?.public_access === true) {
            result.isInternetAccessible = true;
        }
        return result;
    }
}
exports.RiskScoringEngine = RiskScoringEngine;
//# sourceMappingURL=risk-scoring.js.map