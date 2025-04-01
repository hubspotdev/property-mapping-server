# Base stage for dependencies
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage - compile TypeScript to JavaScript
FROM base AS build
COPY . .
# Generate Prisma client before building
RUN npx prisma generate
RUN npm run build

# Production stage - only include what's necessary
FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Install system dependencies needed for PostgreSQL and networking
RUN apt-get update && apt-get install -y \
    postgresql-client \
    netcat-traditional \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Make the entrypoint script executable
RUN chmod +x ./docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the server
CMD ["npm", "run", "prod"]
