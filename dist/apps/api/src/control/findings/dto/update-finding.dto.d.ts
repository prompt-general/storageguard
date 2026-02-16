import { FindingStatus } from '@storageguard/types';
import { CreateFindingDto } from './create-finding.dto';
declare const UpdateFindingDto_base: import("@nestjs/common").Type<Partial<CreateFindingDto>>;
export declare class UpdateFindingDto extends UpdateFindingDto_base {
    status?: FindingStatus;
}
export {};
