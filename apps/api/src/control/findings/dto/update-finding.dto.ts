// apps/api/src/findings/dto/update-finding.dto.ts
import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FindingStatus } from '@storageguard/types';
import { CreateFindingDto } from './create-finding.dto';

export class UpdateFindingDto extends PartialType(CreateFindingDto) {
    @IsOptional()
    @IsEnum(FindingStatus)
    status?: FindingStatus;
}