import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Query string ของ GET /scholarship-rounds/:roundId/applicants (ฝั่ง Evaluator)
 * ตาม REST API spec Module 5 และ OpenAPI `listApplicants`
 *
 * หมายเหตุ: spec ยังมี faculty, myStatus, sortBy, sortOrder ด้วย
 * แต่ใน Step นี้ทำเฉพาะ search / page / limit ก่อน
 */
export class ListApplicantsQueryDto {
  /** คำค้นหา: รหัสนักศึกษา หรือ ชื่อ / นามสกุล (ค้นบางส่วนได้) [FR-EVL-01] */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** หน้าที่ต้องการ เริ่มที่ 1 (ค่าเริ่มต้น 1 ตาม spec) */
  @IsOptional()
  @Type(() => Number) // query string เป็นข้อความเสมอ ต้องแปลงเป็นตัวเลขก่อนตรวจ
  @IsInt()
  @Min(1)
  page: number = 1;

  /** จำนวนแถวต่อหน้า (ค่าเริ่มต้น 20 สูงสุด 100 ตาม spec) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
