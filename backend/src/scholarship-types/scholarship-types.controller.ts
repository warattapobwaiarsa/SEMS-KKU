import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ScholarshipTypesService } from './scholarship-types.service';
import { CreateScholarshipTypeDto } from './dto/create-scholarship-type.dto';
import { UpdateScholarshipTypeDto } from './dto/update-scholarship-type.dto';
import { QueryScholarshipTypeDto } from './dto/query-scholarship-type.dto';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('scholarship-types')
export class ScholarshipTypesController {
  constructor(
    private readonly scholarshipTypesService: ScholarshipTypesService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryScholarshipTypeDto) {
    return this.scholarshipTypesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipTypesService.findOne(id);
  }

  @Post()
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Body() dto: CreateScholarshipTypeDto,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.create(dto, actorId);
  }

  @Put(':id')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScholarshipTypeDto,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.update(id, dto, actorId);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.toggleActive(id, isActive, actorId);
  }

  @Delete(':id')
  @UseGuards(RoleDispatchGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipTypesService.delete(id);
  }
}
