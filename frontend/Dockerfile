# Step 1: Build Stage
FROM node:22 AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./ 
RUN npm install

# Copy the entire project (including `src/` directory)
COPY . . 

# Build Next.js app
RUN npm run build

# Step 2: Production Stage
FROM node:22-slim

WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set environment variable for production
ENV NODE_ENV=production

# Expose Next.js default port
EXPOSE 3000

# Start Next.js application
CMD ["npm", "run", "start"]
