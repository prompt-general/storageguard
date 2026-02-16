import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ControlService } from '../control/control.service';
import { RiskScoringEngine } from '@storageguard/shared';
import { CloudProvider, StorageResource } from '@storageguard/types';

@Injectable()
export class TemplateAnalyzerService {
    private riskEngine = new RiskScoringEngine();

    constructor(
        private parser: ParserService,
        private controlService: ControlService,
    ) { }

    async analyze(content: string, fileType: string, provider: CloudProvider): Promise<any> {
        // 1. Parse template to extract resources
        const resources = this.parser.parse(content, fileType as any, provider);

        // 2. For each resource, run security checks
        const findings = [];
        for (const resource of resources) {
            const resourceFindings = await this.checkResource(resource, provider);
            findings.push(...resourceFindings);
        }

        // 3. Generate report
        return {
            summary: {
                total_resources: resources.length,
                total_findings: findings.length,
                critical: findings.filter(f => f.severity === 'critical').length,
                high: findings.filter(f => f.severity === 'high').length,
                medium: findings.filter(f => f.severity === 'medium').length,
                low: findings.filter(f => f.severity === 'low').length,
                info: findings.filter(f => f.severity === 'info').length,
            },
            findings,
        };
    }

    private async checkResource(resource: StorageResource, provider: CloudProvider): Promise<any[]> {
        const findings = [];
        // Control IDs mapped to check functions
        const checks = [
            { controlId: 'SG-001', check: (r: StorageResource) => ({ failed: r.configuration.public_access }) },
            { controlId: 'SG-002', check: (r: StorageResource) => ({ failed: !r.configuration.encryption_enabled }) },
            { controlId: 'SG-003', check: (r: StorageResource) => ({ failed: !r.configuration.logging_enabled }) },
            { controlId: 'SG-004', check: (r: StorageResource) => ({ failed: !r.configuration.versioning_enabled }) },
            { controlId: 'SG-005', check: (r: StorageResource) => this.checkPolicy(r) },
        ];

        for (const { controlId, check } of checks) {
            const result = check(resource);
            if (result.failed) {
                const baseSeverity = await this.controlService.getBaseSeverity(controlId);
                const remediationAvailable = await this.controlService.isRemediationAvailable(controlId);
                const remediationGuidance = await this.controlService.getRemediationGuidance(controlId);

                findings.push({
                    control_id: controlId,
                    resource_id: resource.resource_id,
                    severity: baseSeverity,
                    title: `${controlId}: Security check failed`,
                    description: `Resource ${resource.resource_id} is non-compliant.`,
                    remediation: remediationGuidance,
                    // line_number not yet supported by parser implementation
                });
            }
        }
        return findings;
    }

    private checkPolicy(resource: StorageResource): any {
        // Simplified policy check for templates
        const policy = resource.configuration.policy;
        if (!policy || Object.keys(policy).length === 0) return { failed: false };
        const permissive = this.riskEngine.detectExposure(policy, {});
        return { failed: permissive.isInternetAccessible || permissive.isAuthenticatedUsersOnly };
    }
}
