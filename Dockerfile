# 1. Use an official lightweight Node.js runtime image
FROM node:20-alpine

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy package files first to leverage Docker cache
COPY package*.json ./

# 4. Install only production dependencies
RUN npm ci --omit=dev

# 5. Copy the rest of the app files
COPY . .

# 6. Set environment to production
ENV NODE_ENV=production

# 7. Expose the app port
EXPOSE 3000

# 8. Default command to run the app
CMD ["node", "server.js"]
