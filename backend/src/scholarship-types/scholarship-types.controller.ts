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
  Headers,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ScholarshipTypesService } from './scholarship-types.service';
import { CreateScholarshipTypeDto } from './dto/create-scholarship-type.dto';
import { UpdateScholarshipTypeDto } from './dto/update-scholarship-type.dto';
import { QueryScholarshipTypeDto } from './dto/query-scholarship-type.dto';
import {
  RoleDispatchGuard,
  type RequestWithResolvedRole,
} from '../common/guards/role-dispatch.guard';
import { BusinessException } from '../common/http-exception.filter';

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
  @UseGuards(RoleDispatchGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Body() dto: CreateScholarshipTypeDto,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const role = request?.resolvedRole || roleHeader || roleQuery;
    if (role && role !== 'ADMIN') {
      throw new BusinessException({
        errorCode: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างประเภททุนได้',
      });
    }
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.create(dto, actorId);
  }

  @Put(':id')
  @UseGuards(RoleDispatchGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScholarshipTypeDto,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const role = request?.resolvedRole || roleHeader || roleQuery;
    if (role && role !== 'ADMIN') {
      throw new BusinessException({
        errorCode: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขประเภททุนได้',
      });
    }
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.update(id, dto, actorId);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RoleDispatchGuard)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const role = request?.resolvedRole || roleHeader || roleQuery;
    if (role && role !== 'ADMIN') {
      throw new BusinessException({
        errorCode: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนสถานะประเภททุนได้',
      });
    }
    const actorId = request?.user?.id ?? null;
    return this.scholarshipTypesService.toggleActive(id, isActive, actorId);
  }

  @Delete(':id')
  @UseGuards(RoleDispatchGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
    @Req() request?: RequestWithResolvedRole,
  ) {
    const role = request?.resolvedRole || roleHeader || roleQuery;
    if (role && role !== 'ADMIN') {
      throw new BusinessException({
        errorCode: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบประเภททุนได้',
      });
    }
    return this.scholarshipTypesService.delete(id);
  }
}
