import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * 1 ข้อใน body ของ PUT my-evaluation
 * ตาม OpenAPI `EvaluationItemScoreDto` (มีแค่ subCriteriaId บังคับ)
 */
export class EvaluationItemScoreDto {
  /** id ของเกณฑ์ย่อยในชุดเกณฑ์ของรอบนี้ */
  @IsInt()
  @Min(1)
  subCriteriaId: number;

  /**
   * คะแนนจำนวนเต็ม 0 ถึง maxScore ของข้อนั้น [FR-EVL-05] [BR-EVL-03]
   * - ไม่ส่ง หรือ null = ยังไม่กรอก เก็บเป็น null ห้ามเป็น 0 [FR-EVL-07] [BR-EVL-07]
   * - การตรวจช่วงค่าทำที่ service เพราะ maxScore ต่างกันทุกข้อ (โยน 422 SCORE_OUT_OF_RANGE)
   */
  @IsOptional()
  @IsNumber()
  score?: number | null;

  /** ความคิดเห็น รับเฉพาะข้อที่ allowComment = true เท่านั้น (ตรวจที่ service) [FR-EVL-06] [BR-EVL-04] */
  @IsOptional()
  @IsString()
  comment?: string | null;

  /** ข้อความของเกณฑ์ย่อยแบบ TEXT (ไม่บังคับ ไม่จำกัดความยาว) [FR-EVL-06] [BR-EVL-05] */
  @IsOptional()
  @IsString()
  textValue?: string | null;
}

/**
 * Body ของ PUT /api/v1/applicants/:applicantId/my-evaluation (Auto-save / Upsert Draft)
 * ตาม OpenAPI `UpsertDraftEvaluationDto`
 *
 * หมายเหตุ (CORE version): ฟิลด์ clientUpdatedAt รับไว้ตาม spec แต่
 * "ไม่ตรวจ STALE_VERSION" — ข้าม concurrency check ตามที่ตัดสินใจไว้
 */
export class SaveMyEvaluationDto {
  /** รายการคะแนนที่ต้องการบันทึก (อย่างน้อย 1 ข้อ) [FR-EVL-04] */
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemScoreDto)
  items: EvaluationItemScoreDto[];

  /** Optimistic lock timestamp ของ spec — CORE ไม่ใช้ แต่ยอมรับไม่ให้ frontend โดน 400 */
  @IsOptional()
  @IsDateString()
  clientUpdatedAt?: string;
}
