# Multi-stage Dockerfile for Next.js (production, standalone output)
# Build dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
ENV CI=1
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Optional build arg to force rebuild of subsequent layers (bump value when you want a fresh build even with unchanged sources)
ARG FORCE_REBUILD=0
RUN echo "Force rebuild token: $FORCE_REBUILD" > /tmp/force_rebuild_token
# Build with standalone output for minimal runtime image
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Create non-root user
RUN addgroup -S app && adduser -S app -G app
# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Expose port
EXPOSE 3000
USER app
ENV PORT=3000
CMD ["node", "server.js"]
