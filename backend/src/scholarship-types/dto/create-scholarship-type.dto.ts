import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

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
}
