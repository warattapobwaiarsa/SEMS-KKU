/**
 * Unit test ของ sumScoredTotal (ฟังก์ชันคำนวณคะแนนรวมแบบ pure function)
 * ไม่ต่อฐานข้อมูลใดๆ ทดสอบแยกเดี่ยวได้
 * [FR-SCR-02] [BR-SCR-02] [BR-EVL-07] [BR-EVL-10]
 */
import { SubCriteriaType } from '@prisma/client';
import { sumScoredTotal } from './score-total';

describe('sumScoredTotal', () => {
  it('รวมคะแนนเฉพาะเกณฑ์ย่อยแบบ SCORED (กรณีปกติ)', () => {
    const total = sumScoredTotal([
      { type: SubCriteriaType.SCORED, score: 40 },
      { type: SubCriteriaType.SCORED, score: 30 },
      { type: SubCriteriaType.SCORED, score: 30 },
    ]);

    expect(total).toBe(100);
  });

  it('ไม่นับเกณฑ์ย่อยแบบ TEXT ถึงแม้ score จะมีค่าก็ตาม [BR-SCR-02]', () => {
    const total = sumScoredTotal([
      { type: SubCriteriaType.SCORED, score: 40 },
      { type: SubCriteriaType.TEXT, score: 99 },
      { type: SubCriteriaType.SCORED, score: 30 },
    ]);

    expect(total).toBe(70);
  });

  it('คะแนนครบทุกข้อเป็นศูนย์ -> ผลรวมเป็น 0 ไม่ใช่ null', () => {
    const total = sumScoredTotal([
      { type: SubCriteriaType.SCORED, score: 0 },
      { type: SubCriteriaType.SCORED, score: 0 },
      { type: SubCriteriaType.SCORED, score: 0 },
    ]);

    expect(total).toBe(0);
  });

  it('กรอกบางข้อ (อีกข้อยังเป็น null) -> บวกเฉพาะข้อมีค่า ไม่เอา null มาเป็น 0 ปลอม', () => {
    const total = sumScoredTotal([
      { type: SubCriteriaType.SCORED, score: 35 },
      { type: SubCriteriaType.SCORED, score: null },
      { type: SubCriteriaType.SCORED, score: null },
      { type: SubCriteriaType.TEXT, score: null },
    ]);

    expect(total).toBe(35);
  });

  it('ไม่มีข้อไหนเลย -> ผลรวมเป็น 0', () => {
    expect(sumScoredTotal([])).toBe(0);
  });
});
