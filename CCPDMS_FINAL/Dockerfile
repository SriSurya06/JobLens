FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Make sure the uploads directory exists (it's used for resume storage)
RUN mkdir -p /app/uploads/resumes

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
