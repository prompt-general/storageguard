import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finding, RemediationAction, RemediationStatus, RemediationActionType, StorageResource, CloudAccount } from '@storageguard/database';
import { CloudProviderInterface } from '@storageguard/shared';
import { AwsProvider } from '@storageguard/scanner/providers/aws.provider';
import { AzureProvider } from '@storageguard/scanner/providers/azure.provider';
import { GcpProvider } from '@storageguard/scanner/providers/gcp.provider';

@Injectable()
export class RemediationService {
    private readonly logger = new Logger(RemediationService.name);
    private providers: Map<string, CloudProviderInterface>;

    constructor(
        @InjectRepository(Finding)
        private findingRepository: Repository<Finding>,
        @InjectRepository(RemediationAction)
        private remediationActionRepository: Repository<RemediationAction>,
        @InjectRepository(StorageResource)
        private storageResourceRepository: Repository<StorageResource>,
        @InjectRepository(CloudAccount)
        private cloudAccountRepository: Repository<CloudAccount>,
    ) {
        this.providers = new Map();
        // Use the actual service instances (in a full NestJS app these should be injected)
        // For simplicity following user code pattern
        this.providers.set('aws', new AwsProvider());
        this.providers.set('azure', new AzureProvider());
        this.providers.set('gcp', new GcpProvider());
    }

    async dryRun(findingId: string, tenantId: string): Promise<any> {
        const finding = await this.getFindingWithResource(findingId, tenantId);
        const provider = this.getProvider(finding.storage_resource.provider);
        const actionType = this.mapControlToAction(finding.control_id);
        const credentials = await this.getCredentials(finding.storage_resource.account_id, tenantId);

        const method = (provider as any)[this.mapActionToMethodName(actionType)];
        if (!method) {
            throw new BadRequestException(`Remediation not available for control ${finding.control_id}`);
        }

        // Pass dryRun = true
        const result = await method.call(provider, finding.storage_resource.resource_id, credentials, true);

        // Store dry-run action in DB with status DRY_RUN_COMPLETED
        const remediationAction = this.remediationActionRepository.create({
            finding_id: findingId,
            action_type: actionType,
            status: RemediationStatus.DRY_RUN_COMPLETED,
            parameters: { dryRun: true },
            execution_result: result,
        });
        await this.remediationActionRepository.save(remediationAction);

        return {
            action_id: remediationAction.id,
            ...result,
        };
    }

    async execute(findingId: string, tenantId: string, options?: { force?: boolean }): Promise<any> {
        const finding = await this.getFindingWithResource(findingId, tenantId);
        const provider = this.getProvider(finding.storage_resource.provider);
        const actionType = this.mapControlToAction(finding.control_id);
        const credentials = await this.getCredentials(finding.storage_resource.account_id, tenantId);

        const methodName = this.mapActionToMethodName(actionType);
        const method = (provider as any)[methodName];
        if (!method) {
            throw new BadRequestException(`Remediation not available for control ${finding.control_id}`);
        }

        // First do a dry run to capture current state
        const dryRunResult = await method.call(provider, finding.storage_resource.resource_id, credentials, true);
        const previousState = dryRunResult.currentState;

        // Execute with dryRun = false
        const result = await method.call(provider, finding.storage_resource.resource_id, credentials, false);

        const remediationAction = this.remediationActionRepository.create({
            finding_id: findingId,
            action_type: actionType,
            status: result.success ? RemediationStatus.EXECUTED : RemediationStatus.FAILED,
            parameters: options || {},
            previous_state: previousState,
            new_state: result.newState,
            execution_result: result,
            executed_at: new Date(),
        });
        await this.remediationActionRepository.save(remediationAction);

        return {
            action_id: remediationAction.id,
            ...result,
        };
    }

    async rollback(actionId: string, tenantId: string): Promise<any> {
        const action = await this.remediationActionRepository.findOne({
            where: { id: actionId },
            relations: ['finding'],
        });
        if (!action) throw new NotFoundException('Remediation action not found');
        if (action.status !== RemediationStatus.EXECUTED) {
            throw new BadRequestException('Only executed actions can be rolled back');
        }

        const finding = action.finding;
        if (finding.tenant_id !== tenantId) throw new NotFoundException();

        return {
            message: 'Rollback not yet implemented, but previous state is available for manual revert.',
            previousState: action.previous_state,
        };
    }

    async getRemediationActions(findingId: string, tenantId: string): Promise<RemediationAction[]> {
        await this.getFindingWithResource(findingId, tenantId);
        return this.remediationActionRepository.find({
            where: { finding_id: findingId },
            order: { created_at: 'DESC' },
        });
    }

    private async getFindingWithResource(findingId: string, tenantId: string): Promise<Finding> {
        const finding = await this.findingRepository.findOne({
            where: { id: findingId, tenant_id: tenantId },
            relations: ['storage_resource'],
        });
        if (!finding) throw new NotFoundException('Finding not found');
        return finding;
    }

    private getProvider(providerName: string): CloudProviderInterface {
        const provider = this.providers.get(providerName);
        if (!provider) throw new BadRequestException(`Unsupported provider: ${providerName}`);
        return provider;
    }

    private async getCredentials(accountId: string, tenantId: string): Promise<any> {
        const account = await this.cloudAccountRepository.findOne({
            where: { id: accountId, tenant_id: tenantId },
        });
        if (!account) throw new NotFoundException('Cloud account not found');
        return account.credentials;
    }

    private mapControlToAction(controlId: string): RemediationActionType {
        const map: Record<string, RemediationActionType> = {
            'SG-001': RemediationActionType.REMOVE_PUBLIC_ACCESS,
            'SG-002': RemediationActionType.ENABLE_ENCRYPTION,
            'SG-003': RemediationActionType.ENABLE_LOGGING,
            'SG-004': RemediationActionType.ENABLE_VERSIONING,
            'SG-005': RemediationActionType.UPDATE_POLICY,
        };
        return map[controlId];
    }

    private mapActionToMethodName(actionType: RemediationActionType): string {
        const map: Record<RemediationActionType, string> = {
            [RemediationActionType.REMOVE_PUBLIC_ACCESS]: 'removePublicAccess',
            [RemediationActionType.ENABLE_ENCRYPTION]: 'enableEncryption',
            [RemediationActionType.ENABLE_LOGGING]: 'enableLogging',
            [RemediationActionType.ENABLE_VERSIONING]: 'enableVersioning',
            [RemediationActionType.UPDATE_POLICY]: 'updatePolicy',
        };
        return map[actionType];
    }
}
