#!/bin/bash
# quick-start.sh

echo "🚀 Setting up StorageGuard development environment..."

# 1. Start database services
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Build all packages
npm run build

# 4. Run database migrations
cd packages/database && npm run db:migrate && cd ../..

# 5. Seed default controls
cd packages/database && npm run seed && cd ../..

# 6. Start scanner in development mode
cd apps/scanner && npm run start:dev &

echo "✅ StorageGuard is starting up!"
echo "📊 PostgreSQL: localhost:5432"
echo "🗄️  Redis: localhost:6379"
echo "📡 Scanner will start scanning every hour"
