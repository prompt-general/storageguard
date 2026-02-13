import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScannerService } from './scanner.service';
import { CloudAccount } from '@storageguard/database';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('scanner')
export class ScannerProcessor {
    private readonly logger = new Logger(ScannerProcessor.name);

    constructor(
        private readonly scannerService: ScannerService,
        @InjectRepository(CloudAccount)
        private readonly cloudAccountRepository: Repository<CloudAccount>,
    ) { }

    @Process('scan-account')
    async handleScanAccount(job: Job<{ accountId: string }>) {
        this.logger.log(`Processing scan job for account: ${job.data.accountId}`);

        const account = await this.cloudAccountRepository.findOne({
            where: { id: job.data.accountId },
        });

        if (!account) {
            this.logger.error(`Account not found: ${job.data.accountId}`);
            return;
        }

        try {
            await this.scannerService.scanAccount(account);
            this.logger.log(`Successfully completed scan for account: ${account.id}`);
        } catch (error) {
            this.logger.error(`Failed to scan account ${account.id}:`, error);
            throw error;
        }
    }

    @Process('scan-all')
    async handleScanAll() {
        this.logger.log('Processing scan-all job');
        await this.scannerService.scanAllAccounts();
    }
}
