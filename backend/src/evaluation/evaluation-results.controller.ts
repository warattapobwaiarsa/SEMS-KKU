import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RoleDispatchGuard } from '../common/guards/role-dispatch.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EvaluationResultsQueryDto } from './dto/evaluation-results-query.dto';
import {
  ApplicantEvaluationResultsResponse,
  EvaluationResultsService,
  RoundEvaluationResultsResponse,
} from './evaluation-results.service';

@Controller()
export class EvaluationResultsController {
  constructor(
    private readonly evaluationResultsService: EvaluationResultsService,
  ) {}

  /**
   * GET /api/v1/scholarship-rounds/:roundId/evaluation-results
   * แสดงตารางคะแนนรวมเฉลี่ย Real-time, จำนวน Submitted, และอันดับ Tie-break (BR-SCR-05) สำหรับ Admin
   */
  @Get('scholarship-rounds/:roundId/evaluation-results')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getRoundEvaluationResults(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Query() query: EvaluationResultsQueryDto,
  ): Promise<RoundEvaluationResultsResponse> {
    return this.evaluationResultsService.getRoundEvaluationResults(
      roundId,
      query,
    );
  }

  /**
   * GET /api/v1/applicants/:applicantId/evaluation-results
   * รายละเอียดคะแนนรายผู้ประเมิน, Comment, Text value เฉพาะผลที่มีสถานะ SUBMITTED สำหรับ Admin (FR-SCR-06, E9)
   */
  @Get('applicants/:applicantId/evaluation-results')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getApplicantEvaluationResults(
    @Param('applicantId', ParseIntPipe) applicantId: number,
  ): Promise<ApplicantEvaluationResultsResponse> {
    return this.evaluationResultsService.getApplicantEvaluationResults(
      applicantId,
    );
  }
}
