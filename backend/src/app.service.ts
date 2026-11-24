import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkHealth(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    let dbStatus = 'ok';
    if (this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (err: unknown) {
        dbStatus = err instanceof Error ? err.message : 'Database check failed';
      }
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
