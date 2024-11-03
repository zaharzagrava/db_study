import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiConfigService } from './api-config/api-config.service';
import { ValidationPipe } from '@nestjs/common';
import { Environment } from './types';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService: ApiConfigService = app.get(ApiConfigService);

  // Setting up listening settings
  app.setGlobalPrefix('api');

  // Setting up validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validateCustomDecorators: true,
    }),
  );

  // Setting up logging
  app.useLogger(app.get(Logger));

  // Setting up CORS
  const origins = [configService.get('front_host')];
  if (configService.get('node_env') !== Environment.production) {
    origins.push('http://localhost:3000');
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Setting up docs
  const config = new DocumentBuilder()
    .setTitle('Db Study')
    .setDescription('Db Study API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(configService.get('port'));
}
bootstrap();
