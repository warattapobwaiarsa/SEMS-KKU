import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CriteriaModule } from './criteria/criteria.module';
import { RoundsModule } from './rounds/rounds.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    PrismaModule,
    CriteriaModule,
    RoundsModule,
    ApplicantsModule,
    EvaluationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
