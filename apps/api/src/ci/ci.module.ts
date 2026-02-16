import { Module } from '@nestjs/common';
import { CiController } from './ci.controller';
import { CiService } from './ci.service';
import { ParserService } from './parser.service';
import { TemplateAnalyzerService } from './analyzer.service';
import { ControlModule } from '../control/control.module';

@Module({
    imports: [ControlModule],
    controllers: [CiController],
    providers: [CiService, ParserService, TemplateAnalyzerService],
    exports: [CiService, TemplateAnalyzerService],
})

export class CiModule { }
