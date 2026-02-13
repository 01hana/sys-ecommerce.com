import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1/admin');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // 自動根據 DTO 型別轉型
    }),
  );

  // 開放 public 資料夾，讓 /public/uploads/... 可被讀取
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors();

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
