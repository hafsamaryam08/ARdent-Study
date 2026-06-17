# Use Node.js LTS slim image as build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies (including devDependencies for building client & server)
RUN npm ci

# Copy the entire workspace code
COPY . .

# Run production build (compiles Vite React frontend and bundles Express server)
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled production outputs from the builder stage
COPY --from=builder /app/dist ./dist

# Hugging Face Spaces runs on port 7860 by default
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

# Command to start the Express production server
CMD ["npm", "run", "start"]
