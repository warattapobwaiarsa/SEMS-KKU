import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmImportDto {
  @IsString()
  @IsNotEmpty()
  previewToken!: string;

  @IsBoolean()
  acknowledgedInvalidRows!: boolean;
}
