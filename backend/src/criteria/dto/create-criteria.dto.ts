import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubCriteriaType } from '@prisma/client';

export class CreateSubCriteriaDto {
  @IsInt()
  @Min(1)
  sortOrder: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(SubCriteriaType)
  type: SubCriteriaType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  allowComment?: boolean = false;
}

export class CreateCriteriaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  targetScore?: number = 100;

  @ValidateNested({ each: true })
  @Type(() => CreateSubCriteriaDto)
  @ArrayMinSize(1)
  subCriteria: CreateSubCriteriaDto[];
}
