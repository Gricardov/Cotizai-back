/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Servidor ejecutándose en http://localhost:3000');
}
bootstrap();
