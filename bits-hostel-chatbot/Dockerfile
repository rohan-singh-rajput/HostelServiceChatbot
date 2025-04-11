# -------------------------------
# Development Setup
# -------------------------------
    FROM node:18-slim

    WORKDIR /app
    
    # Install dependencies
    COPY package.json package-lock.json ./
    RUN npm ci
    
    # Copy source code
    COPY . .
    
    # Expose the development server port
    EXPOSE 3000
    
    # Run the development server
    CMD ["npm", "run", "dev"]