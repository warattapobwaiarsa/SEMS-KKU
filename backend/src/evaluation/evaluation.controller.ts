import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import type { RequestWithUser } from '../common/guards/mock-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SaveMyEvaluationDto } from './dto/save-my-evaluation.dto';
import {
  EvaluationReadService,
  MyEvaluationView,
} from './evaluation-read.service';
import { EvaluationWriteService } from './evaluation-write.service';

/**
 * Endpoint ฝั่ง Evaluator สำหรับการประเมินผู้สมัคร
 * ทุก endpoint ต้องล็อกอิน (MockAuthGuard) และเป็น EVALUATOR เท่านั้น (RolesGuard)
 * role อื่นได้ 403 FORBIDDEN [FR-AUTH-04]
 * หมายเหตุ: route นี้ไม่ชนกับ Admin เพราะเป็น path /my-evaluation และ /submit เท่านั้น
 */
@Controller()
@UseGuards(MockAuthGuard, RolesGuard)
@Roles(UserRole.EVALUATOR)
export class EvaluationController {
  constructor(
    private readonly evaluationReadService: EvaluationReadService,
    private readonly evaluationWriteService: EvaluationWriteService,
  ) {}

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
  @HttpCode(HttpStatus.OK) // spec กำหนด 200 (Nest default ของ POST คือ 201)
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
}
