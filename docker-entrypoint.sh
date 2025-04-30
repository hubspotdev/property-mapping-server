#!/bin/sh
set -e

# Ensure PostgreSQL environment variables are set with defaults
: "${PGUSER:=zradford}"
: "${PGPASSWORD:=zradford}"
: "${PGDATABASE:=docker-test-property}"
: "${PGHOST:=db}"

# Export all PostgreSQL variables
export PGUSER PGPASSWORD PGDATABASE PGHOST

# Print environment variables for debugging (password will be masked)
echo "Debugging environment:"
echo "DATABASE_URL structure: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
echo "NODE_ENV: $NODE_ENV"
echo "PGUSER from env: $PGUSER"
echo "PGDATABASE from env: $PGDATABASE"
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

# Test direct database connection with proper error handling
echo "Testing direct PostgreSQL connection..."
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT 1" > /dev/null 2>&1; then
    echo "Direct PostgreSQL connection successful!"
    break
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -eq $max_retries ]; then
      echo "Failed to connect to PostgreSQL after $max_retries attempts"
      exit 1
    fi
    echo "Connection attempt $retry_count failed, retrying..."
    sleep 5
  fi
done

# Initialize database if needed
echo "Initializing database..."

# Debug the Prisma schema file
echo "Showing Prisma schema file contents:"
cat ./prisma/schema.prisma

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run Prisma migrations with explicit environment variables
echo "Running database migrations..."
DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:5432/${PGDATABASE}" npx prisma migrate deploy

# Verify schema was applied correctly with timeout
echo "Verifying database schema..."
verify_timeout=30
verify_counter=0

while [ $verify_counter -lt $verify_timeout ]; do
  if PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "\\dt" | grep -q "Properties"; then
    echo "Schema verification successful. Properties table exists."
    break
  else
    verify_counter=$((verify_counter + 1))

    if [ $verify_counter -eq $verify_timeout ]; then
      echo "ERROR: Properties table does not exist after migrations!"

      # One final attempt with prisma db push
      echo "Attempting final Prisma db push..."
      if DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:5432/${PGDATABASE}" npx prisma db push --accept-data-loss; then
        if PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "\\dt" | grep -q "Properties"; then
          echo "Database schema created successfully with db push."
          break
        fi
      fi

      echo "CRITICAL ERROR: Could not create database schema!"
      echo "Current database tables:"
      PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "\\dt"
      exit 1
    fi

    echo "Waiting for schema verification... ($verify_counter/$verify_timeout)"
    sleep 1
  fi
done

# Optional: Seed the database if needed
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database..."
  if ! DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:5432/${PGDATABASE}" npx prisma db seed; then
    echo "WARNING: Database seeding failed!"
    echo "Current tables:"
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "\\dt"
    echo "Continuing startup despite seeding failure..."
  else
    echo "Database seeding completed successfully."
  fi
fi

echo "Starting the application..."
exec "$@"
