FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# PORT is injected via docker-compose / k8s env
EXPOSE ${PORT}
CMD ["node", "src/index.js"]
