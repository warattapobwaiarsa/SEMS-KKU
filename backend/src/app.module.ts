import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CriteriaModule } from './criteria/criteria.module';

@Module({
  imports: [PrismaModule, CriteriaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
