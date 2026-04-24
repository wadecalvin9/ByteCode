# Stage 1: Build Dashboard
FROM node:20-alpine AS dashboard-build
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm install
COPY dashboard/ ./
RUN npm run build

# Stage 2: Server & Final Image
FROM node:20-alpine
WORKDIR /app

# Install native build tools and Go for payload generation
RUN apk add --no-cache python3 make g++ go

# Set environment for Go cross-compilation
ENV GOOS=windows
ENV GOARCH=amd64
ENV CGO_ENABLED=0

# Install dependencies for server
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source
COPY server/ ./server/

# Copy agent source (required for payload builder)
COPY agent/ ./agent/
RUN cd agent && go mod download

# Copy built dashboard from Stage 1
COPY --from=dashboard-build /app/dashboard/dist ./dashboard/dist

# Copy CLI tool
COPY bin/ ./bin/
COPY package.json ./

# Create directories
RUN mkdir -p /app/server/data /app/exfiltrated_files /app/payloads

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the server
CMD ["node", "server/src/index.js"]
