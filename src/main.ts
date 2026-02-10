import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/admin');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // 自動根據 DTO 型別轉型
    }),
  );
  app.enableCors();

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
