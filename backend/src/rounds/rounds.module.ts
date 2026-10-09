import { Module } from '@nestjs/common';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [PrismaModule, EvaluationModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
