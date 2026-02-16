"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('StorageGuard API')
        .setDescription('Multi-cloud storage security platform')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(3000);
    console.log(`StorageGuard API running on http://localhost:3000`);
    console.log(`API documentation available at http://localhost:3000/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map