FROM node:18-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    git \
    build-base

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
