// apps/api/src/findings/dto/create-finding.dto.ts
import { IsUUID, IsString, IsEnum, IsInt, Min, Max, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { FindingSeverity, FindingStatus } from '@storageguard/types';

export class CreateFindingDto {
    @IsUUID()
    tenant_id: string;

    @IsUUID()
    resource_id: string;

    @IsString()
    control_id: string;

    @IsEnum(FindingSeverity)
    severity: FindingSeverity;

    @IsInt()
    @Min(0)
    @Max(100)
    risk_score: number;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsObject()
    evidence: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    remediation_available?: boolean;

    @IsOptional()
    @IsString()
    remediation_guidance?: string;
}