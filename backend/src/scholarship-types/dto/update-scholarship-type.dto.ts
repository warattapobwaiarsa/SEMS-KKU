import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NestedCriteriaDto } from './create-scholarship-type.dto';

export class UpdateScholarshipTypeDto {
  @IsOptional()
  @IsString({ message: 'ชื่อประเภททุนต้องเป็นข้อความ' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'คำอธิบายต้องเป็นข้อความ' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'รหัสเกณฑ์เริ่มต้นต้องเป็นจำนวนเต็ม' })
  @Min(1, { message: 'รหัสเกณฑ์เริ่มต้นต้องมากกว่า 0' })
  defaultCriteriaId?: number | null;

  @IsOptional()
  @IsBoolean({ message: 'สถานะการใช้งานต้องเป็น boolean' })
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => NestedCriteriaDto)
  criteria?: NestedCriteriaDto;
}
