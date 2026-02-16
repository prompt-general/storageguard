import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.service';
import { CloudProvider, StorageResource } from '@storageguard/types';
import { RiskScoringEngine } from '@storageguard/shared';

@Injectable()
export class CiService {
    private riskEngine = new RiskScoringEngine();

    constructor(private parserService: ParserService) { }

    async analyzeTemplate(content: string, fileName: string, provider: CloudProvider): Promise<any> {
        const fileType = this.getFileType(fileName);
        const resources = this.parserService.parse(content, fileType, provider);

        const findings = [];
        for (const resource of resources) {
            const evaluation = this.evaluateResource(resource);
            findings.push(...evaluation);
        }

        return {
            summary: {
                total_resources: resources.length,
                total_findings: findings.length,
                severity_counts: this.countSeverities(findings),
            },
            findings,
        };
    }

    private getFileType(fileName: string): 'tf' | 'tf.json' | 'yaml' | 'json' {
        if (fileName.endsWith('.tf')) return 'tf';
        if (fileName.endsWith('.tf.json')) return 'tf.json';
        if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'yaml';
        if (fileName.endsWith('.json')) return 'json';
        return 'json';
    }

    private evaluateResource(resource: StorageResource): any[] {
        const findings = [];

        // SG-001: Public Access
        if (resource.configuration.public_access) {
            findings.push(this.createFinding('SG-001', resource, 'Public access is enabled.'));
        }

        // SG-002: Encryption
        if (!resource.configuration.encryption_enabled) {
            findings.push(this.createFinding('SG-002', resource, 'Server-side encryption is disabled.'));
        }

        // SG-003: Logging
        if (!resource.configuration.logging_enabled) {
            findings.push(this.createFinding('SG-003', resource, 'Bucket logging is disabled.'));
        }

        // SG-004: Versioning
        if (!resource.configuration.versioning_enabled) {
            findings.push(this.createFinding('SG-004', resource, 'Versioning is disabled.'));
        }

        // SG-005: Policy
        const policyResult = this.checkPolicy(resource.configuration.policy);
        if (policyResult.failed) {
            findings.push(this.createFinding('SG-005', resource, `Overly permissive policy: ${policyResult.details}`));
        }

        return findings;
    }

    private createFinding(controlId: string, resource: StorageResource, message: string) {
        // Standard severities (could be fetched from ControlService if needed)
        const severityMap: any = {
            'SG-001': 'high',
            'SG-002': 'medium',
            'SG-003': 'low',
            'SG-004': 'low',
            'SG-005': 'high',
        };

        const severity = severityMap[controlId] || 'medium';

        // Calculate risk score (simple version for IaC)
        const riskScore = this.riskEngine.calculateRiskScore({
            baseSeverity: severity as any,
            isInternetAccessible: resource.configuration.public_access,
            isAuthenticatedUsersOnly: false,
            businessCriticality: 1.0,
        });

        return {
            control_id: controlId,
            resource_id: resource.resource_id,
            severity,
            risk_score: riskScore,
            message,
        };
    }

    private checkPolicy(policy: any): { failed: boolean; details?: string } {
        if (!policy || Object.keys(policy).length === 0) return { failed: false };

        const statements = policy.Statement || [];
        for (const statement of statements) {
            if (statement.Effect === 'Allow') {
                if (statement.Principal === '*' || statement.Principal?.AWS === '*') {
                    return { failed: true, details: 'Wildcard principal found.' };
                }
                if (statement.Action === '*' || (Array.isArray(statement.Action) && statement.Action.includes('*'))) {
                    return { failed: true, details: 'Wildcard action found.' };
                }
            }
        }
        return { failed: false };
    }

    private countSeverities(findings: any[]) {
        return findings.reduce((acc, f) => {
            acc[f.severity] = (acc[f.severity] || 0) + 1;
            return acc;
        }, {});
    }
}
