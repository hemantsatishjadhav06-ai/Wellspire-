# Portable container image — works on Render, Railway, Fly, Cloud Run, etc.
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching (workspace manifests only)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm install

# Copy source and build the frontend
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Hosts inject PORT; the server reads process.env.PORT (default 8080)
EXPOSE 8080

CMD ["npm", "start"]
