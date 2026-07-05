# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend and the backend server bundle
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets and required files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/case_01.json ./case_01.json

# Expose port and define runtime environment variables
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
