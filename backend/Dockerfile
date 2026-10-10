# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci

# Copy backend source & prisma schema
COPY backend/ ./backend/

WORKDIR /app/backend

# Generate Prisma Client & Build NestJS app
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: run as non-root user
USER node

# Copy compiled backend output & runtime files from builder
COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/backend/package.json ./backend/
COPY --chown=node:node --from=builder /app/backend/dist ./backend/dist
COPY --chown=node:node --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/main"]
