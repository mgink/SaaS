FROM node:20-slim AS builder

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci

# Tüm dosyaları kopyala
COPY . .

# Next.js build
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# Production bağımlılıklarını yükle
COPY package*.json ./
RUN npm ci --only=production

# Build dosyalarını kopyala
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]