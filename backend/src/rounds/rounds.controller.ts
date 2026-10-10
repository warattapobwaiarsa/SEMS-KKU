import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoundsService } from './rounds.service';
import {
  CreateScholarshipRoundDto,
  UpdateScholarshipRoundDto,
  LinkCriteriaDto,
  CloseRoundDto,
} from './dto/round.dto';
import { RoundStatus } from '@prisma/client';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
import { EvaluationReadService } from '../evaluation/evaluation-read.service';

@Controller('scholarship-rounds')
export class RoundsController {
  constructor(
    private readonly roundsService: RoundsService,
    private readonly evaluationReadService: EvaluationReadService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('academicYear') academicYear?: number,
    @Query('semester') semester?: number,
    @Query('status') status?: RoundStatus,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
  ) {
    const userRole = roleHeader || roleQuery;
    return this.roundsService.findAll({
      page,
      limit,
      search,
      academicYear,
      semester,
      status,
      userRole,
    });
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreateScholarshipRoundDto) {
    return this.roundsService.create(dto);
  }

  @Get(':id')
  @UseGuards(RoleDispatchGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ): Promise<unknown> {
    const resolvedRole = request?.resolvedRole;

    // ADMIN path: ใช้ service เดิม (role จาก header/query หรือ ADMIN legacy)
    if (resolvedRole === 'ADMIN') {
      const userRole = roleHeader || roleQuery || 'ADMIN';
      return this.roundsService.findOne(id, userRole);
    }

    // EVALUATOR path: ใช้ service ของ Evaluator (return EvaluatorRoundDetail)
    return this.evaluationReadService.getRoundForEvaluator(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScholarshipRoundDto,
  ) {
    return this.roundsService.update(id, dto);
  }

  @Patch(':id/criteria')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async linkCriteria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkCriteriaDto,
  ) {
    return this.roundsService.linkCriteria(id, dto);
  }

  @Get(':id/open-check')
  async checkOpenReadiness(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.checkOpenReadiness(id);
  }

  @Post(':id/open')
  async openRound(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.openRound(id);
  }

  @Get(':id/close-check')
  async checkCloseStatus(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.checkCloseStatus(id);
  }

  @Post(':id/close')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async closeRound(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseRoundDto,
  ) {
    return this.roundsService.closeRound(id, dto);
  }
}
