import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { webcrypto } from 'crypto';

// Polyfill crypto for Node 18 compatibility with @nestjs/schedule
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const registerGracefulShutdown = (app: INestApplication) => {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  const shutdown = async (signal: NodeJS.Signals) => {
    try {
      console.log(`Subscription service received ${signal}. Closing gracefully...`);
      await app.close();
      console.log('Subscription service closed gracefully.');
      process.exit(0);
    } catch (error) {
      console.error('Error during subscription service shutdown:', error);
      process.exit(1);
    }
  };

  signals.forEach((signal) => {
    process.once(signal, () => {
      void shutdown(signal);
    });
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Subscription Service API')
    .setDescription('REST API for managing subscriptions, plans, and users')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Include your JWT access token: `Bearer <token>`',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true,
      defaultModelsExpandDepth: -1, // Hide schemas section
    },
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      `Subscription service listening on http://127.0.0.1:${
        process.env.PORT ?? 3000
      } (docs available at /docs)`,
    );
  });

  registerGracefulShutdown(app);
}
bootstrap();
