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

  // app.useStaticAssets(join(__dirname, '..', 'public')); // __dirname 指向 src or dist 目錄，會導致路徑錯誤
  app.useStaticAssets(join(process.cwd(), 'public'), { // process.cwd() 永遠指向根目錄
    prefix: '/',
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors();

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
