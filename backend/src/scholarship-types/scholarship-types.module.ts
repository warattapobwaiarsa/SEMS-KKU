import { Module } from '@nestjs/common';
import { ScholarshipTypesService } from './scholarship-types.service';
import { ScholarshipTypesController } from './scholarship-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScholarshipTypesController],
  providers: [ScholarshipTypesService],
  exports: [ScholarshipTypesService],
})
export class ScholarshipTypesModule {}
