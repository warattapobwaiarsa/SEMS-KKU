import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import type { RequestWithUser } from '../common/guards/mock-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ListApplicantsQueryDto } from './dto/list-applicants-query.dto';
import {
  EvaluationService,
  PaginatedApplicantList,
} from './evaluation.service';

/**
 * Endpoint ฝั่ง Evaluator สำหรับการประเมินผู้สมัคร
 * ทุก endpoint ต้องล็อกอิน (MockAuthGuard) และเป็น EVALUATOR เท่านั้น (RolesGuard)
 * role อื่นได้ 403 FORBIDDEN [FR-AUTH-04]
 */
@Controller()
@UseGuards(MockAuthGuard, RolesGuard)
@Roles(UserRole.EVALUATOR)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  /**
   * GET /api/v1/scholarship-rounds/:roundId/applicants
   * รายชื่อผู้สมัครของรอบที่ OPEN แบบแบ่งหน้า + ค้นหา [FR-EVL-01] [BR-EVL-01]
   */
  @Get('scholarship-rounds/:roundId/applicants')
  listApplicants(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Query() query: ListApplicantsQueryDto,
    @Req() request: RequestWithUser,
  ): Promise<PaginatedApplicantList> {
    // MockAuthGuard แนบ user ไว้แล้วเสมอเมื่อมาถึงตรงนี้
    const evaluatorUser = request.user!;
    return this.evaluationService.listApplicantsForEvaluator(
      roundId,
      evaluatorUser,
      query,
    );
  }
}
