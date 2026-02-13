#!/bin/bash
# test-api.sh

echo "🔧 Testing StorageGuard API..."

# Ensure database is running
docker-compose up -d

# Install dependencies and build
npm install
npm run build

# Run migrations
cd packages/database && npm run db:migrate && npm run seed && cd ../..

# Start API server in background
cd apps/api && npm run start:dev &

# Wait for server to start
sleep 10

# Test health endpoint
curl -X GET http://localhost:3000/api/v1/findings/stats

echo "✅ API is running"
