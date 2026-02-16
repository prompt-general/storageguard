import { Job } from 'bull';
import { ScannerService } from './scanner.service';
import { CloudAccount } from '@storageguard/database';
import { Repository } from 'typeorm';
export declare class ScannerProcessor {
    private readonly scannerService;
    private readonly cloudAccountRepository;
    private readonly logger;
    constructor(scannerService: ScannerService, cloudAccountRepository: Repository<CloudAccount>);
    handleScanAccount(job: Job<{
        accountId: string;
    }>): Promise<void>;
    handleScanAll(): Promise<void>;
}
