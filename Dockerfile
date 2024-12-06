# Base image
FROM node:20.14-alpine AS base

# Stage 1: Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package manager files only
COPY package.json pnpm-lock.yaml* ./

# Install necessary system packages before dependencies
RUN apk add --no-cache libc6-compat && \
    corepack enable pnpm && \
    pnpm config set registry https://registry.npmjs.org

# Install node_modules separately
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 2: Builder stage
FROM base AS builder
WORKDIR /app

# Define build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_API_URL
ARG NEXT_PUBLIC_DEFAULT_MODEL_NAME
ARG NEXT_PUBLIC_HIDE_BRAND
ARG NEXT_PUBLIC_LOG_LEVEL
ARG NEXT_PUBLIC_302_WEBSITE_URL_CHINA
ARG NEXT_PUBLIC_302_WEBSITE_URL_GLOBAL
ARG NEXT_PUBLIC_AUTH_PATH
ARG NEXT_PUBLIC_IS_CHINA
ARG NEXT_PUBLIC_DEFAULT_LOCALE

# Set environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_DEFAULT_MODEL_NAME=$NEXT_PUBLIC_DEFAULT_MODEL_NAME
ENV NEXT_PUBLIC_HIDE_BRAND=$NEXT_PUBLIC_HIDE_BRAND
ENV NEXT_PUBLIC_LOG_LEVEL=$NEXT_PUBLIC_LOG_LEVEL
ENV NEXT_PUBLIC_302_WEBSITE_URL_CHINA=$NEXT_PUBLIC_302_WEBSITE_URL_CHINA
ENV NEXT_PUBLIC_302_WEBSITE_URL_GLOBAL=$NEXT_PUBLIC_302_WEBSITE_URL_GLOBAL
ENV NEXT_PUBLIC_AUTH_PATH=$NEXT_PUBLIC_AUTH_PATH
ENV NEXT_PUBLIC_IS_CHINA=$NEXT_PUBLIC_IS_CHINA
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN corepack enable pnpm && pnpm run build

# Stage 3: Runner stage
FROM base AS runner
WORKDIR /app
# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Copy static files
COPY --from=builder /app/public ./public
# Set permissions for pre-rendered cache
RUN mkdir .next
RUN chown nextjs:nodejs .next
# Copy build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Switch to non-root user
USER nextjs
# Expose port
EXPOSE 3000
# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Start command
CMD ["node", "server.js"]
