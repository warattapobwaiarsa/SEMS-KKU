import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  Headers,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicantsService } from './applicants.service';
import { ConfirmImportDto } from './dto/import-applicant.dto';
import { QueryApplicantDto } from './dto/query-applicant.dto';
import { BusinessException } from '../common/http-exception.filter';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
import { EvaluationService } from '../evaluation/evaluation.service';
import { EvaluationReadService } from '../evaluation/evaluation-read.service';
import { User } from '@prisma/client';

@Controller()
@UseGuards(RoleDispatchGuard)
export class ApplicantsController {
  constructor(
    private readonly applicantsService: ApplicantsService,
    private readonly evaluationService: EvaluationService,
    private readonly evaluationReadService: EvaluationReadService,
  ) {}

  @Post('scholarship-rounds/:roundId/applicants/preview-excel')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB (BR-IMP-02)
      },
    }),
  )
  async previewExcel(
    @Param('roundId', ParseIntPipe) roundId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BusinessException({
        errorCode: 'INVALID_EXCEL_FILE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'กรุณาเลือกไฟล์ .xlsx เพื่ออัปโหลด (BR-IMP-02)',
      });
    }

    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BusinessException({
        errorCode: 'INVALID_EXCEL_FILE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไฟล์ต้องเป็นนามสกุล .xlsx เท่านั้น (BR-IMP-02)',
      });
    }

    return this.applicantsService.previewExcel(roundId, file);
  }

  @Post('scholarship-rounds/:roundId/applicants/import')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async confirmImport(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Body() dto: ConfirmImportDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const actorId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.applicantsService.confirmImport(roundId, dto, actorId);
  }

  @Delete(
    'scholarship-rounds/:roundId/applicants/import-previews/:previewToken',
  )
  cancelPreview(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('previewToken') previewToken: string,
  ) {
    return this.applicantsService.cancelPreview(roundId, previewToken);
  }

  @Get('scholarship-rounds/:roundId/applicants')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Query() query: QueryApplicantDto,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ): Promise<unknown> {
    const resolvedRole = request?.resolvedRole;

    // ADMIN path: ใช้ service เดิม
    if (resolvedRole === 'ADMIN') {
      const userRole = roleHeader || roleQuery || 'ADMIN';
      return this.applicantsService.findAll(roundId, query, userRole);
    }

    // EVALUATOR path: ใช้ service ของ Evaluator (ต้องมี request.user จาก guard)
    const evaluatorUser = request?.user as User;
    // Transform QueryApplicantDto to ListApplicantsQueryDto (page/limit are required numbers in evaluator DTO)
    const evaluatorQuery = {
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    return this.evaluationService.listApplicantsForEvaluator(
      roundId,
      evaluatorUser,
      evaluatorQuery,
    );
  }

  @Get('scholarship-rounds/:roundId/applicants/imports')
  async getImportHistory(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.applicantsService.getImportHistory(roundId);
  }

  @Get('applicants/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ): Promise<unknown> {
    const resolvedRole = request?.resolvedRole;

    // ADMIN path: ใช้ service เดิม
    if (resolvedRole === 'ADMIN') {
      const userRole = roleHeader || roleQuery || 'ADMIN';
      return this.applicantsService.findOne(id, userRole);
    }

    // EVALUATOR path: ใช้ service ของ Evaluator
    return this.evaluationReadService.getApplicantDetailForEvaluator(id);
  }
}
