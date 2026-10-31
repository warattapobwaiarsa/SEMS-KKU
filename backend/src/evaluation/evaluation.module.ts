import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationReadService } from './evaluation-read.service';
import { EvaluationWriteService } from './evaluation-write.service';
import { EvaluationService } from './evaluation.service';
import { EvaluationResultsController } from './evaluation-results.controller';
import { EvaluationResultsService } from './evaluation-results.service';

/**
 * โมดูลการประเมินผู้สมัคร (ฝั่ง Evaluator และฝั่ง Admin สรุปคะแนน) [FR-EVL-01] [FR-SCR-01..06]
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController, EvaluationResultsController],
  providers: [
    EvaluationService,
    EvaluationReadService,
    EvaluationWriteService,
    EvaluationResultsService,
  ],
  exports: [EvaluationService, EvaluationReadService, EvaluationResultsService],
})
export class EvaluationModule {}
