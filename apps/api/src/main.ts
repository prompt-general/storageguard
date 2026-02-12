// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.setGlobalPrefix('api/v1');

    const config = new DocumentBuilder()
        .setTitle('StorageGuard API')
        .setDescription('Multi-cloud storage security platform')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3000);
    console.log(`StorageGuard API running on http://localhost:3000`);
    console.log(`API documentation available at http://localhost:3000/api/docs`);
}
bootstrap();