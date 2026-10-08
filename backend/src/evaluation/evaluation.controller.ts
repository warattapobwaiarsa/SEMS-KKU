import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { SaveMyEvaluationDto } from './dto/save-my-evaluation.dto';
import {
  EvaluationReadService,
  EvaluatorApplicantDetail,
  EvaluatorRoundDetail,
  MyEvaluationView,
} from './evaluation-read.service';
import { EvaluationWriteService } from './evaluation-write.service';
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
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly evaluationReadService: EvaluationReadService,
    private readonly evaluationWriteService: EvaluationWriteService,
  ) {}

  /**
   * GET /api/v1/scholarship-rounds/:roundId
   * รายละเอียดรอบทุน (เฉพาะรอบ OPEN) สำหรับหัวหน้าจอประเมิน [BR-EVL-01]
   * หมายเหตุ: spec ให้ Admin ใช้ route นี้ด้วย แต่ตอนนี้ทำเฉพาะมุมมอง Evaluator
   */
  @Get('scholarship-rounds/:roundId')
  getRound(
    @Param('roundId', ParseIntPipe) roundId: number,
  ): Promise<EvaluatorRoundDetail> {
    return this.evaluationReadService.getRoundForEvaluator(roundId);
  }

  /**
   * GET /api/v1/applicants/:applicantId
   * รายละเอียดผู้สมัคร (อ่านอย่างเดียว) ฝั่งซ้ายของหน้าประเมิน [FR-APP-03] [BR-APP-04]
   * หมายเหตุ: spec ให้ Admin ใช้ route นี้ด้วย แต่ตอนนี้ทำเฉพาะมุมมอง Evaluator
   */
  @Get('applicants/:applicantId')
  getApplicant(
    @Param('applicantId', ParseIntPipe) applicantId: number,
  ): Promise<EvaluatorApplicantDetail> {
    return this.evaluationReadService.getApplicantDetailForEvaluator(
      applicantId,
    );
  }

  /**
   * GET /api/v1/applicants/:applicantId/my-evaluation
   * ผลประเมินของตัวเอง + เกณฑ์ย่อย (ฝั่งขวาของหน้าประเมิน) [FR-EVL-14] [FR-EVL-04]
   */
  @Get('applicants/:applicantId/my-evaluation')
  getMyEvaluation(
    @Param('applicantId', ParseIntPipe) applicantId: number,
    @Req() request: RequestWithUser,
  ): Promise<MyEvaluationView> {
    // MockAuthGuard แนบ user ไว้แล้วเสมอเมื่อมาถึงตรงนี้
    const evaluatorUser = request.user!;
    return this.evaluationReadService.getMyEvaluation(
      applicantId,
      evaluatorUser,
    );
  }

  /**
   * PUT /api/v1/applicants/:applicantId/my-evaluation
   * Auto-save / Upsert Draft ( frontend เรียกซ้ำได้เรื่อยๆ ~3 วินาทีหลังหยุดพิมพ์)
   * [FR-EVL-04] [FR-EVL-08] [BR-EVL-06] [BR-EVL-09]
   */
  @Put('applicants/:applicantId/my-evaluation')
  saveMyEvaluation(
    @Param('applicantId', ParseIntPipe) applicantId: number,
    @Body() body: SaveMyEvaluationDto,
    @Req() request: RequestWithUser,
  ): Promise<MyEvaluationView> {
    // MockAuthGuard แนบ user ไว้แล้วเสมอเมื่อมาถึงตรงนี้
    const evaluatorUser = request.user!;
    return this.evaluationWriteService.saveMyEvaluation(
      applicantId,
      evaluatorUser,
      body,
    );
  }

  /**
   * POST /api/v1/applicants/:applicantId/my-evaluation/submit
   * ยืนยันส่งผล DRAFT -> SUBMITTED พร้อมตรวจคะแนนครบและบันทึก Audit Log
   * [FR-EVL-11] [FR-EVL-13] [FR-EVL-15] [BR-EVL-11]
   */
  @Post('applicants/:applicantId/my-evaluation/submit')
  submitMyEvaluation(
    @Param('applicantId', ParseIntPipe) applicantId: number,
    @Req() request: RequestWithUser,
  ): Promise<MyEvaluationView> {
    // MockAuthGuard แนบ user ไว้แล้วเสมอเมื่อมาถึงตรงนี้
    const evaluatorUser = request.user!;
    return this.evaluationWriteService.submitMyEvaluation(
      applicantId,
      evaluatorUser,
    );
  }

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
