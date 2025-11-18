import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Subscription Service API')
    .setDescription('REST API for managing subscriptions, plans, and users')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      `Subscription service listening on http://127.0.0.1:${
        process.env.PORT ?? 3000
      } (docs available at /docs)`,
    );
  });
}
bootstrap();
