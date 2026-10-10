import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationReadService } from './evaluation-read.service';
import { EvaluationWriteService } from './evaluation-write.service';
import { EvaluationService } from './evaluation.service';

/**
 * โมดูลการประเมินผู้สมัคร (ฝั่ง Evaluator) [FR-EVL-01]
 * มีรายชื่อผู้สมัคร + API อ่านอย่างเดียว + การบันทึก/ส่งคะแนน (Step 6)
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, EvaluationReadService, EvaluationWriteService],
  exports: [EvaluationService, EvaluationReadService],
})
export class EvaluationModule {}
