# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./frontend/

WORKDIR /app/frontend

# Build Next.js app in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

USER node

# Copy standalone build output
COPY --chown=node:node --from=builder /app/frontend/.next/standalone ./
COPY --chown=node:node --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --chown=node:node --from=builder /app/frontend/public ./frontend/public

WORKDIR /app/frontend

EXPOSE 3000

CMD ["node", "server.js"]
