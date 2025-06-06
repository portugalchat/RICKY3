# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build:client && npm run build:server

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]