import { Module } from '@nestjs/common';
import { ApplicantsController } from './applicants.controller';
import { ApplicantsService } from './applicants.service';
import { ExcelParserService } from './excel-parser.service';
import { LocationRoutingService } from './location-routing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [PrismaModule, EvaluationModule],
  controllers: [ApplicantsController],
  providers: [ApplicantsService, ExcelParserService, LocationRoutingService],
  exports: [ApplicantsService, LocationRoutingService],
})
export class ApplicantsModule {}
