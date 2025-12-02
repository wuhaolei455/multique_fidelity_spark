import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 增加请求体大小限制
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

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
    origin: true, // 允许所有来源（反射请求头中的 Origin），配合 credentials: true 使用
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
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

  const port = process.env.PORT || 3001;
  await app.listen(port); 
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

