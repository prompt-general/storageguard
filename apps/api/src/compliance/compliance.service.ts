import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Control, Finding, StorageResource } from '@storageguard/database';

export interface ComplianceFramework {
    id: string; // e.g., 'cis', 'soc2', 'iso27001'
    name: string;
    version?: string;
}

export interface ComplianceControl {
    frameworkId: string;
    controlId: string; // e.g., 'CIS 2.1.3'
    description?: string;
}

export interface ComplianceStatus {
    framework: string;
    total_controls: number;
    passed_controls: number;
    failed_controls: number;
    not_applicable_controls?: number;
    compliance_percentage: number;
    controls: Array<{
        control_id: string;
        framework_control_id: string;
        status: 'passed' | 'failed' | 'partially' | 'not_applicable';
        finding_ids?: string[];
        resources_count?: number;
    }>;
}

@Injectable()
export class ComplianceService {
    private readonly logger = new Logger(ComplianceService.name);
    private frameworks: ComplianceFramework[] = [
        { id: 'cis', name: 'CIS Benchmarks', version: '1.4' },
        { id: 'soc2', name: 'SOC 2', version: '2017' },
        { id: 'iso27001', name: 'ISO 27001', version: '2013' },
        { id: 'nist', name: 'NIST 800-53', version: 'Rev5' },
    ];

    constructor(
        @InjectRepository(Control)
        private controlRepository: Repository<Control>,
        @InjectRepository(Finding)
        private findingRepository: Repository<Finding>,
        @InjectRepository(StorageResource)
        private resourceRepository: Repository<StorageResource>,
    ) { }

    async getFrameworks(): Promise<ComplianceFramework[]> {
        return this.frameworks;
    }

    async getComplianceOverview(tenantId: string): Promise<any> {
        const results: Record<string, any> = {};
        for (const framework of this.frameworks) {
            const status = await this.getFrameworkCompliance(tenantId, framework.id);
            results[framework.id] = {
                name: framework.name,
                version: framework.version,
                ...status,
            };
        }
        return results;
    }

    async getFrameworkCompliance(tenantId: string, frameworkId: string): Promise<ComplianceStatus> {
        // Get all controls that have mappings to this framework
        const controls = await this.controlRepository.find();
        const frameworkControls = controls.filter(c =>
            c.compliance_mapping && (c.compliance_mapping as any)[frameworkId] && (c.compliance_mapping as any)[frameworkId].length > 0
        );

        // For each control, we need to know for this tenant which resources are failing/passing.
        // We'll query findings for open findings grouped by control.
        const openFindings = await this.findingRepository
            .createQueryBuilder('finding')
            .innerJoinAndSelect('finding.storage_resource', 'resource')
            .where('finding.tenant_id = :tenantId', { tenantId })
            .andWhere('finding.status IN (:...statuses)', { statuses: ['open', 'suppressed'] })
            .getMany();

        // Group findings by control_id
        const findingsByControl = new Map<string, Finding[]>();
        openFindings.forEach(finding => {
            if (!findingsByControl.has(finding.control_id)) {
                findingsByControl.set(finding.control_id, []);
            }
            findingsByControl.get(finding.control_id)!.push(finding);
        });

        // For each framework control (i.e., each mapping), determine status.
        const controlStatuses = [];
        let totalControls = 0;
        let passedControls = 0;
        let failedControls = 0;

        for (const control of frameworkControls) {
            const frameworkControlIds = (control.compliance_mapping as any)[frameworkId] || [];
            for (const frameworkControlId of frameworkControlIds) {
                totalControls++;
                const findings = findingsByControl.get(control.id) || [];
                // Determine if any resource fails this control
                const failingResources = findings.filter(f => f.status === 'open').length;
                if (failingResources === 0) {
                    // All resources are compliant for this control? We need to know total resources.
                    // For now, we'll consider control passed if no open findings.
                    passedControls++;
                    controlStatuses.push({
                        control_id: control.id,
                        framework_control_id: frameworkControlId,
                        status: 'passed' as const,
                    });
                } else {
                    failedControls++;
                    controlStatuses.push({
                        control_id: control.id,
                        framework_control_id: frameworkControlId,
                        status: 'failed' as const,
                        finding_ids: findings.filter(f => f.status === 'open').map(f => f.id),
                        resources_count: failingResources,
                    });
                }
            }
        }

        const compliancePercentage = totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 100;

        return {
            framework: frameworkId,
            total_controls: totalControls,
            passed_controls: passedControls,
            failed_controls: failedControls,
            compliance_percentage: compliancePercentage,
            controls: controlStatuses,
        };
    }

    async getComplianceByResource(tenantId: string, resourceId: string): Promise<any> {
        // For a specific resource, get compliance status per framework control.
        const findings = await this.findingRepository.find({
            where: {
                tenant_id: tenantId,
                resource_id: resourceId,
                status: 'open' as any,
            },
        });
        const controlIds = findings.map(f => f.control_id);

        if (controlIds.length === 0) {
            const result: Record<string, any> = {};
            for (const framework of this.frameworks) {
                result[framework.id] = {
                    name: framework.name,
                    controls: [],
                };
            }
            return result;
        }

        const controls = await this.controlRepository.find({
            where: {
                id: In(controlIds)
            }
        });

        const result: Record<string, any> = {};
        for (const framework of this.frameworks) {
            const frameworkControls = [];
            for (const control of controls) {
                const mappings = (control.compliance_mapping as any)?.[framework.id] || [];
                for (const fwControlId of mappings) {
                    frameworkControls.push({
                        control_id: control.id,
                        framework_control_id: fwControlId,
                        status: 'failed',
                        finding_id: findings.find(f => f.control_id === control.id)?.id,
                    });
                }
            }
            result[framework.id] = {
                name: framework.name,
                controls: frameworkControls,
            };
        }
        return result;
    }
}
