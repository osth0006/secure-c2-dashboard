# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the static export
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Serve the static files
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/out ./out
EXPOSE 3000
CMD ["serve", "out", "-l", "3000"]
