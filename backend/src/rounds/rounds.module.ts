import { Module } from '@nestjs/common';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
