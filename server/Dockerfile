# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port your app uses (adjust if different)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
