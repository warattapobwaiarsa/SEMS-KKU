import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

/**
 * โมดูลการประเมินผู้สมัคร (ฝั่ง Evaluator) [FR-EVL-01]
 * ตอนนี้มีแค่รายชื่อผู้สมัคร ส่วนการบันทึก/ส่งคะแนนจะเพิ่มในขั้นถัดไป
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
