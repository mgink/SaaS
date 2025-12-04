import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // ⭐ CORS'u etkinleştir - TÜM originlere izin ver
    app.enableCors({
      origin: true, // Tüm originlere izin ver (production'da spesifik domain belirtin)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Cloud Run için PORT ortam değişkenini kullan
    const port = parseInt(process.env.PORT || '8080', 10);

    // '0.0.0.0' host adresi - Cloud Run için kritik
    await app.listen(port, '0.0.0.0');

    logger.log(`✅ Application started successfully on port ${port}`);
    logger.log(`🌍 Listening on http://0.0.0.0:${port}`);
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();