#!/bin/sh

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start the application
exec node server.js 