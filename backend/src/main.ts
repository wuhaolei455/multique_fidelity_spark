import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true, // 启用 CORS
  });

  // 配置 WebSocket 适配器
  app.useWebSocketAdapter(new IoAdapter(app));

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS配置 - 允许 WebSocket 连接
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('Spark多保真度调优框架 API')
    .setDescription('Spark/MySQL多保真度超参数调优框架的后端API接口文档')
    .setVersion('1.0')
    .addTag('config-space', '配置空间相关接口')
    .addTag('result', '任务结果相关接口')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

