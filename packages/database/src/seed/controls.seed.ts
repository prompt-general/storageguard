// packages/database/src/seed/controls.seed.ts
import { Control, FindingSeverity } from '../entities/control.entity';

export const DEFAULT_CONTROLS: Partial<Control>[] = [
    {
        id: 'SG-001',
        name: 'Public Access Check',
        description: 'Storage resource should not have public access enabled',
        base_severity: FindingSeverity.HIGH,
        provider_specific: {
            aws: { service: 's3', check_type: 'bucket_policy' },
            azure: { resource_type: 'Microsoft.Storage/storageAccounts', check_type: 'network_rules' },
            gcp: { service: 'storage', check_type: 'iam_policy' },
        },
        compliance_mapping: {
            cis: ['CIS 2.1.3'],
            soc2: ['CC6.1'],
        },
    },
    {
        id: 'SG-002',
        name: 'Encryption at Rest',
        description: 'Storage resource should have encryption enabled',
        base_severity: FindingSeverity.MEDIUM,
        provider_specific: {
            aws: { service: 's3', check_type: 'encryption' },
            azure: { resource_type: 'Microsoft.Storage/storageAccounts', check_type: 'encryption' },
            gcp: { service: 'storage', check_type: 'encryption' },
        },
        compliance_mapping: {
            cis: ['CIS 2.1.1'],
            iso27001: ['A.10.1.1'],
        },
    },
    {
        id: 'SG-003',
        name: 'Access Logging',
        description: 'Storage resource should have access logging enabled',
        base_severity: FindingSeverity.MEDIUM,
        provider_specific: {
            aws: { service: 's3', check_type: 'logging' },
            azure: { resource_type: 'Microsoft.Storage/storageAccounts', check_type: 'logging' },
            gcp: { service: 'storage', check_type: 'logging' },
        },
        compliance_mapping: {
            soc2: ['CC7.1'],
        },
    },
    {
        id: 'SG-004',
        name: 'Versioning/Soft Delete',
        description: 'Storage resource should have versioning or soft delete enabled',
        base_severity: FindingSeverity.MEDIUM,
        provider_specific: {
            aws: { service: 's3', check_type: 'versioning' },
            azure: { resource_type: 'Microsoft.Storage/storageAccounts', check_type: 'delete_retention' },
            gcp: { service: 'storage', check_type: 'versioning' },
        },
    },
    {
        id: 'SG-005',
        name: 'Overly Permissive Policies',
        description: 'Storage resource should not have overly permissive access policies',
        base_severity: FindingSeverity.HIGH,
        provider_specific: {
            aws: { service: 's3', check_type: 'bucket_policy' },
            azure: { resource_type: 'Microsoft.Storage/storageAccounts', check_type: 'iam_policy' },
            gcp: { service: 'storage', check_type: 'iam_policy' },
        },
        compliance_mapping: {
            cis: ['CIS 2.1.1'],
        },
    },
];