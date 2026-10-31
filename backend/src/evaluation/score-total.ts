import { SubCriteriaType } from '@prisma/client';

/**
 * ข้อมูล 1 ข้อของแบบประเมิน สำหรับใช้คำนวณผลรวมคะแนน
 * เจตนาให้เป็น "pure function" รับค่าอย่างเดียว ไม่แตะฐานข้อมูล
 */
export interface ScoreTotalInput {
  type: SubCriteriaType;
  /** null = ยังไม่กรอก (ไม่ใช่ 0) [BR-EVL-07] */
  score: number | null;
}

/**
 * คำนวณคะแนนรวม: บวกเฉพาะเกณฑ์ย่อยแบบ SCORED เท่านั้น
 * - เกณฑ์ย่อยแบบ TEXT ไม่นับ [FR-SCR-02] [BR-SCR-02]
 * - score เป็น null (ยังไม่กรอก) ไม่บวก ไม่ทำเป็น 0 ปลอม [BR-EVL-07]
 *
 * ใช้ตอน Submit เท่านั้น ค่า Draft ยังเป็น preliminary ไม่ใช่ผลทางการ [BR-EVL-10]
 */
export function sumScoredTotal(items: ScoreTotalInput[]): number {
  return items.reduce<number>((total, item) => {
    if (item.type !== SubCriteriaType.SCORED) {
      return total;
    }
    if (item.score === null) {
      return total;
    }
    return total + item.score;
  }, 0);
}
