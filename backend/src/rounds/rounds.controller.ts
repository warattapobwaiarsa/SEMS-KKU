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
import { RoundStatus, UserRole } from '@prisma/client';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
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
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScholarshipRoundDto,
  ) {
    return this.roundsService.update(id, dto);
  }

  @Patch(':id/criteria')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async linkCriteria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkCriteriaDto,
  ) {
    return this.roundsService.linkCriteria(id, dto);
  }

  @Get(':id/open-check')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkOpenReadiness(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.checkOpenReadiness(id);
  }

  @Post(':id/open')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async openRound(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.openRound(id);
  }

  @Get(':id/close-check')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkCloseStatus(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.checkCloseStatus(id);
  }

  @Post(':id/close')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async closeRound(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseRoundDto,
  ) {
    return this.roundsService.closeRound(id, dto);
  }

  @Get(':id/allocation')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllocation(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.getAllocationSummary(id);
  }

  @Post(':id/allocation/budget')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async setBudget(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetBudgetDto,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id;
    return this.roundsService.setRoundBudget(id, dto, actorId);
  }

  @Put(':id/allocation/items')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async saveAllocations(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveAllocationsDto,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id;
    return this.roundsService.saveAllocations(id, dto, actorId);
  }

  @Post(':id/allocation/finalize')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async finalizeAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id;
    return this.roundsService.finalizeAllocation(id, actorId);
  }

  @Post(':id/allocation/reopen')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reopenAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id;
    return this.roundsService.reopenAllocation(id, actorId);
  }

  @Delete(':id')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteRound(
    @Param('id', ParseIntPipe) id: number,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id;
    return this.roundsService.deleteDraftRound(id, actorId);
  }
}
