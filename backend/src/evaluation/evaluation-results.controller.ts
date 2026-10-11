import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppException } from '../common/exceptions/app.exception';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
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
  @UseGuards(RoleDispatchGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getRoundEvaluationResults(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Query() query: EvaluationResultsQueryDto,
    @Req() request?: RequestWithResolvedRole,
  ): Promise<RoundEvaluationResultsResponse> {
    if (request?.resolvedRole !== 'ADMIN') {
      throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

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
  @UseGuards(RoleDispatchGuard)
  async getApplicantEvaluationResults(
    @Param('applicantId', ParseIntPipe) applicantId: number,
    @Req() request?: RequestWithResolvedRole,
  ): Promise<ApplicantEvaluationResultsResponse> {
    if (request?.resolvedRole !== 'ADMIN') {
      throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return this.evaluationResultsService.getApplicantEvaluationResults(
      applicantId,
    );
  }
}
