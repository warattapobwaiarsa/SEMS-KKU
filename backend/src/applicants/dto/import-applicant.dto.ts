import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ImportMode {
  OVERWRITE = 'OVERWRITE',
  APPEND = 'APPEND',
}

export class ConfirmImportDto {
  @IsString()
  @IsNotEmpty()
  previewToken!: string;

  @IsBoolean()
  acknowledgedInvalidRows!: boolean;

  @IsOptional()
  @IsEnum(ImportMode)
  importMode?: ImportMode;
}
