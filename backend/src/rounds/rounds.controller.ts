import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
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
import { SetBudgetDto, SaveAllocationsDto } from './dto/allocation.dto';
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
  @UseGuards(RoleDispatchGuard)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('academicYear') academicYear?: number,
    @Query('semester') semester?: number,
    @Query('status') status?: RoundStatus,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const resolvedRole = request?.resolvedRole;
    const userRole = resolvedRole || roleHeader || roleQuery;
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

    if (resolvedRole === 'ADMIN') {
      const userRole = roleHeader || roleQuery || 'ADMIN';
      return this.roundsService.findOne(id, userRole);
    }

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

  @Get(':id/allocation')
  @UseGuards(RoleDispatchGuard)
  async getAllocation(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.getAllocationSummary(id);
  }

  @Post(':id/allocation/budget')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(RoleDispatchGuard)
  async setBudget(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetBudgetDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const actorId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.roundsService.setRoundBudget(id, dto, actorId);
  }

  @Put(':id/allocation/items')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(RoleDispatchGuard)
  async saveAllocations(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveAllocationsDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const actorId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.roundsService.saveAllocations(id, dto, actorId);
  }

  @Post(':id/allocation/finalize')
  @UseGuards(RoleDispatchGuard)
  async finalizeAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const actorId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.roundsService.finalizeAllocation(id, actorId);
  }

  @Post(':id/allocation/reopen')
  @UseGuards(RoleDispatchGuard)
  async reopenAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const actorId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    return this.roundsService.reopenAllocation(id, actorId);
  }

  @Delete(':id')
  @UseGuards(RoleDispatchGuard)
  async deleteRound(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId =
      request?.user?.id ??
      (userIdHeader ? parseInt(userIdHeader, 10) : undefined);
    return this.roundsService.deleteDraftRound(id, actorId);
  }
}
