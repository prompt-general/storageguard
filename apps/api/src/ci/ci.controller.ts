import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplateAnalyzerService } from './analyzer.service';
import { CloudProvider } from '@storageguard/types';

class AnalyzeRequest {
    content: string;
    fileType: 'tf' | 'tf.json' | 'yaml' | 'json';
    provider: CloudProvider;
}

@ApiTags('ci')
@ApiBearerAuth()
@Controller('ci')
@UseGuards(JwtAuthGuard)
export class CiController {
    constructor(private analyzer: TemplateAnalyzerService) { }

    @Post('analyze')
    @HttpCode(200)
    @ApiOperation({ summary: 'Analyze IaC template for storage misconfigurations' })
    async analyzeTemplate(@Body() body: AnalyzeRequest) {
        return this.analyzer.analyze(body.content, body.fileType, body.provider);
    }
}
