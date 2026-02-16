#!/bin/bash

# StorageGuard CI/CD Template Analyzer
# Usage: ./analyze-template.sh <file_path> <provider> [api_url]

FILE_PATH=$1
PROVIDER=$2
API_URL=${3:-"http://localhost:3000/api/ci/analyze"}

if [ -z "$FILE_PATH" ] || [ -z "$PROVIDER" ]; then
  echo "Usage: ./analyze-template.sh <file_path> <provider> [api_url]"
  echo "Example: ./analyze-template.sh main.tf aws"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo "Error: File $FILE_PATH not found"
  exit 1
fi

echo "Analyzing $FILE_PATH for $PROVIDER misconfigurations..."

RESPONSE=$(curl -s -X POST "$API_URL?provider=$PROVIDER" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$FILE_PATH")

# Check if response has findings
TOTAL_FINDINGS=$(echo $RESPONSE | jq -r '.summary.total_findings')

if [ "$TOTAL_FINDINGS" == "null" ]; then
  echo "Error: Failed to analyze template. Response:"
  echo $RESPONSE
  exit 1
fi

echo "Analysis complete. Total findings: $TOTAL_FINDINGS"
echo $RESPONSE | jq -r '.findings[] | "- [\(.severity)] \(.control_id) on \(.resource_id): \(.message)"'

if [ "$TOTAL_FINDINGS" -gt 0 ]; then
  echo "Security issues detected!"
  # Exit with non-zero code to fail CI pipeline if high severity findings exist
  HIGH_FINDINGS=$(echo $RESPONSE | jq -r '.summary.severity_counts.high // 0')
  CRITICAL_FINDINGS=$(echo $RESPONSE | jq -r '.summary.severity_counts.critical // 0')
  
  if [ "$HIGH_FINDINGS" -gt 0 ] || [ "$CRITICAL_FINDINGS" -gt 0 ]; then
    exit 1
  fi
fi

exit 0
