import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class SetBudgetDto {
  @IsNumber()
  @Min(0, { message: 'งบประมาณต้องไม่ต่ำกว่า 0' })
  totalBudget!: number;
}

export class AllocationItemDto {
  @IsInt()
  applicantId!: number;

  @IsBoolean()
  isAwarded!: boolean;

  @IsNumber()
  @Min(0, { message: 'จำนวนเงินจัดสรรต้องไม่ต่ำกว่า 0' })
  amount!: number;
}

export class SaveAllocationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AllocationItemDto)
  allocations!: AllocationItemDto[];
}
