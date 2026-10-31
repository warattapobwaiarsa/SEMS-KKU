import { Module } from '@nestjs/common';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CriteriaController],
  providers: [CriteriaService],
  exports: [CriteriaService],
})
export class CriteriaModule {}
