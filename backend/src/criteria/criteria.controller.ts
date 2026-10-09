import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';

@Controller('criteria')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.criteriaService.findAll({ page, limit, search });
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader?: string,
    @Query('userRole') roleQuery?: string,
  ) {
    const userRole = roleHeader || roleQuery;
    return this.criteriaService.findOne(id, userRole);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createCriteriaDto: CreateCriteriaDto) {
    return this.criteriaService.create(createCriteriaDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCriteriaDto: UpdateCriteriaDto,
  ) {
    return this.criteriaService.update(id, updateCriteriaDto);
  }
}
