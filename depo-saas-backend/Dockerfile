FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Tüm dosyaları kopyala
COPY . .

# Bağımlılıkları yükle
RUN npm install

# KRİTİK: Prisma generate için geçici DATABASE_URL tanımla
# Bu sadece Prisma Client kodunu oluşturmak için kullanılır, gerçek bağlantı yapmaz
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma Client oluştur
RUN npx dotenv -e .env -- npx prisma generate

# Build yap
RUN npm run build

# Dist klasörünü kontrol et
RUN echo "=== Dist folder structure ===" && find dist -type f

EXPOSE 8080

# Runtime'da gerçek DATABASE_URL kullanılacak (gcloud komutundan gelecek)
CMD ["sh", "-c", "npx dotenv -e .env -- npx dotenv -e .env -- npx prisma migrate deploy && node $(find dist -name 'main.js' | head -1)"]