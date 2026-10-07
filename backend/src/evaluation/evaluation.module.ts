import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationReadService } from './evaluation-read.service';
import { EvaluationService } from './evaluation.service';

/**
 * โมดูลการประเมินผู้สมัคร (ฝั่ง Evaluator) [FR-EVL-01]
 * ตอนนี้มีรายชื่อผู้สมัคร + API อ่านอย่างเดียวของหน้าประเมิน
 * ส่วนการบันทึก/ส่งคะแนนจะเพิ่มในขั้นถัดไป
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, EvaluationReadService],
})
export class EvaluationModule {}
