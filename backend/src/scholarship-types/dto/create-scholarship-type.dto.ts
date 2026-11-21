import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubCriteriaType } from '@prisma/client';

export class NestedSubCriteriaDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsNotEmpty({ message: 'กรุณาระบุชื่อหัวข้อเกณฑ์ย่อย' })
  @IsString()
  title: string;

  @IsEnum(SubCriteriaType)
  type: SubCriteriaType;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  allowComment?: boolean = false;
}

export class NestedCriteriaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt({ message: 'คะแนนเป้าหมายต้องเป็นจำนวนเต็ม' })
  @Min(1, { message: 'คะแนนเป้าหมายต้องมากกว่า 0' })
  targetScore?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedSubCriteriaDto)
  subCriteria?: NestedSubCriteriaDto[];
}

export class CreateScholarshipTypeDto {
  @IsNotEmpty({ message: 'กรุณาระบุชื่อประเภททุน' })
  @IsString({ message: 'ชื่อประเภททุนต้องเป็นข้อความ' })
  name: string;

  @IsOptional()
  @IsString({ message: 'คำอธิบายต้องเป็นข้อความ' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'รหัสเกณฑ์เริ่มต้นต้องเป็นจำนวนเต็ม' })
  @Min(1, { message: 'รหัสเกณฑ์เริ่มต้นต้องมากกว่า 0' })
  defaultCriteriaId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NestedCriteriaDto)
  criteria?: NestedCriteriaDto;
}
