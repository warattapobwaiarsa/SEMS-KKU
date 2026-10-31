import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateScholarshipRoundDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(2550)
  @Max(2700)
  academicYear: number;

  @IsInt()
  @Min(1)
  @Max(2)
  semester: number;

  @IsOptional()
  @IsInt()
  criteriaId?: number;
}

export class UpdateScholarshipRoundDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(2550)
  @Max(2700)
  academicYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  semester?: number;
}

export class LinkCriteriaDto {
  @IsOptional()
  @IsInt()
  criteriaId: number | null;
}

export class CloseRoundDto {
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;

  @IsOptional()
  @IsInt()
  acknowledgedCount?: number;
}
