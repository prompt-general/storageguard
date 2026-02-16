import { Module } from '@nestjs/common';
import { CiController } from './ci.controller';
import { CiService } from './ci.service';
import { ParserService } from './parser.service';

@Module({
    controllers: [CiController],
    providers: [CiService, ParserService],
    exports: [CiService],
})
export class CiModule { }
