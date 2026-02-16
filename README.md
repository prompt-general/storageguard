# StorageGuard

## Overview
StorageGuard is a tool for scanning and securing storage accounts across various cloud providers.

## Structure
- `apps/`: Application source code
  - `api/`: API service
  - `scanner/`: Scanning engine
- `packages/`: Shared libraries
  - `database/`: Database models and utilities
  - `shared/`: Common utilities
  - `types/`: TypeScript definitions

## Features
- **Multi-Cloud Support**: AWS, Azure, and GCP.
- **Sensitivity Scanning**: Detects PII and credentials in storage objects.
- **Shift-Left Security**: Analyze IaC templates (Terraform, CloudFormation) in CI/CD pipelines.
- **Dynamic Risk Scoring**: Factors in data sensitivity and exposure.

## CI/CD Integration
Catch misconfigurations before they are deployed by integrating the StorageGuard CLI into your automated workflows.

Example for GitHub Actions:
```yaml
- name: StorageGuard Scan
  run: storageguard-ci ./infrastructure/main.tf
  env:
    STORAGEGUARD_API_KEY: ${{ secrets.STORAGEGUARD_API_KEY }}
    CLOUD_PROVIDER: aws
```
See [docs/ci-examples/](docs/ci-examples/) for more integration guides.

