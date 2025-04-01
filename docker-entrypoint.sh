#!/bin/sh
set -e

# Print environment variables for debugging (password will be masked)
echo "Debugging environment:"
echo "DATABASE_URL structure: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
echo "NODE_ENV: $NODE_ENV"
echo "POSTGRES_USER from env: $POSTGRES_USER"
echo "POSTGRES_DB from env: $POSTGRES_DB"
echo "HOSTNAME: $(hostname)"

# Wait for PostgreSQL to become available
echo "Waiting for PostgreSQL to become available..."
timeout=60
counter=0

# Simple TCP connection check first
until nc -z db 5432 || [ $counter -eq $timeout ]
do
  echo "Waiting for database connection ($counter/$timeout)..."
  sleep 1
  counter=$((counter+1))
done

if [ $counter -eq $timeout ]; then
  echo "Error: Failed to connect to database within timeout period."
  exit 1
fi

echo "Database TCP connection successful."

# Test direct database connection
echo "Testing direct PostgreSQL connection..."
export PGPASSWORD=postgres
if psql -h db -U postgres -d property_mappings -c "SELECT 1" > /dev/null 2>&1; then
  echo "Direct PostgreSQL connection successful!"
else
  echo "Direct PostgreSQL connection failed. Error code: $?"
  # List available databases for debugging
  echo "Available databases:"
  psql -h db -U postgres -c "\l" || echo "Could not list databases"

  # Try to create the database if it doesn't exist
  echo "Attempting to create database..."
  psql -h db -U postgres -c "CREATE DATABASE property_mappings;" || echo "Could not create database"
fi

echo "Initializing database..."

# Debug the Prisma schema file
echo "Showing Prisma schema file contents:"
cat ./prisma/schema.prisma

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run Prisma migrations (deploy existing migrations)
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "ERROR: Prisma migrate deploy failed!"
  exit 1
}

# Verify schema was applied correctly
echo "Verifying database schema..."
if ! psql -h db -U postgres -d property_mappings -c "\\dt" | grep -q "Properties"; then
  echo "ERROR: Properties table does not exist after migrations!"

  # Try running Prisma db push as a fallback
  echo "Attempting Prisma db push as a fallback..."
  npx prisma db push --accept-data-loss || echo "Prisma db push failed"

  # Final check
  if ! psql -h db -U postgres -d property_mappings -c "\\dt" | grep -q "Properties"; then
    echo "CRITICAL ERROR: Still could not create Properties table!"
    echo "Database tables:"
    psql -h db -U postgres -d property_mappings -c "\\dt"
    exit 1
  fi
else
  echo "Schema verification successful. Properties table exists."
fi

# Optional: Seed the database if needed
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database..."
  if ! npx prisma db seed; then
    echo "WARNING: Database seeding failed!"
    echo "Current tables:"
    psql -h db -U postgres -d property_mappings -c "\\dt"
    echo "Continuing startup anyway..."
  else
    echo "Database seeding completed successfully."
  fi
fi

echo "Starting the application..."
exec "$@"
