import { Repository } from 'typeorm';
import { CloudAccount, StorageResource } from '@storageguard/database';
import { FindingsService } from '../../../api/src/control/findings/findings.service';
import { ControlService } from '../../../api/src/control/control.service';
export declare class ScannerService {
    private cloudAccountRepository;
    private storageResourceRepository;
    private findingsService;
    private controlService;
    private readonly logger;
    private providers;
    private riskEngine;
    constructor(cloudAccountRepository: Repository<CloudAccount>, storageResourceRepository: Repository<StorageResource>, findingsService: FindingsService, controlService: ControlService);
    scanAllAccounts(): Promise<void>;
    scanAccount(account: CloudAccount): Promise<void>;
    private updateOrCreateResource;
    private runSecurityChecks;
    private evaluateCheckResult;
}
