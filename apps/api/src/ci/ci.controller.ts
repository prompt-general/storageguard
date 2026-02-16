import { Controller, Post, UseInterceptors, UploadedFile, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TemplateAnalyzerService } from './analyzer.service';
import { CloudProvider } from '@storageguard/types';

@ApiTags('ci')
@Controller('ci')
export class CiController {
    constructor(private analyzerService: TemplateAnalyzerService) { }


    @Post('analyze')
    @ApiOperation({ summary: 'Analyze IaC template for storage misconfigurations' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                provider: {
                    type: 'string',
                    enum: ['aws', 'azure', 'gcp'],
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async analyzeTemplate(
        @UploadedFile() file: Express.Multer.File,
        @Query('provider') provider: CloudProvider,
    ) {
        if (!file) {
            throw new BadRequestException('No template file uploaded');
        }
        if (!provider) {
            throw new BadRequestException('Cloud provider must be specified (aws, azure, gcp)');
        }

        const content = file.buffer.toString('utf-8');
        return this.ciService.analyzeTemplate(content, file.originalname, provider);
    }
}
