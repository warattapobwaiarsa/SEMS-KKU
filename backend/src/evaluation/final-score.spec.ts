/**
 * Unit test ของ calculateFinalScore / formatScoreDisplay (คะแนนสุดท้ายของผู้สมัคร)
 * pure function ล้วน ไม่ต่อฐานข้อมูล
 * [FR-SCR-01] [FR-SCR-03] [BR-SCR-03] [BR-SCR-04] [BR-SCR-05]
 */
import { EvaluationStatus } from '@prisma/client';
import { calculateFinalScore, formatScoreDisplay } from './final-score';

describe('calculateFinalScore', () => {
  it('ผู้ประเมิน 2 คน ได้ 80 และ 85 -> average 82.5, display "82.50" [FR-SCR-03]', () => {
    const result = calculateFinalScore([
      { status: EvaluationStatus.SUBMITTED, totalScore: 80 },
      { status: EvaluationStatus.SUBMITTED, totalScore: 85 },
    ]);

    expect(result.average).toBe(82.5);
    expect(result.count).toBe(2);
    expect(result.display).toBe('82.50');
  });

  it('ไม่มีผลประเมินเลย -> average 0, count 0, display "0.00" [BR-SCR-04]', () => {
    const result = calculateFinalScore([]);

    expect(result.average).toBe(0);
    expect(result.count).toBe(0);
    expect(result.display).toBe('0.00');
  });

  it('มีแต่ Draft (ไม่มี SUBMITTED) -> เหมือนไม่มีข้อมูล  Draft ไม่ถูกนับ [FR-SCR-01]', () => {
    const result = calculateFinalScore([
      { status: EvaluationStatus.DRAFT, totalScore: 40 },
      { status: EvaluationStatus.DRAFT, totalScore: 100 },
    ]);

    expect(result.average).toBe(0);
    expect(result.count).toBe(0);
    expect(result.display).toBe('0.00');
  });

  it('Draft ปนอยู่กับ SUBMITTED -> ใช้เฉพาะ SUBMITTED', () => {
    const result = calculateFinalScore([
      { status: EvaluationStatus.DRAFT, totalScore: 40 },
      { status: EvaluationStatus.SUBMITTED, totalScore: 80 },
      { status: EvaluationStatus.DRAFT, totalScore: 0 },
    ]);

    expect(result.average).toBe(80);
    expect(result.count).toBe(1);
    expect(result.display).toBe('80.00');
  });

  it('มี SUBMITTED อันเดียว -> คะแนนนั้นคือค่าเฉลี่ย', () => {
    const result = calculateFinalScore([
      { status: EvaluationStatus.SUBMITTED, totalScore: 77 },
    ]);

    expect(result.average).toBe(77);
    expect(result.count).toBe(1);
    expect(result.display).toBe('77.00');
  });

  it('ค่าเฉลี่ยทศนิยมยาว (100/3): display "33.33" แต่ average เก็บค่าก่อนปัดไว้เทียบอันดับ [BR-SCR-05]', () => {
    const result = calculateFinalScore([
      { status: EvaluationStatus.SUBMITTED, totalScore: 34 },
      { status: EvaluationStatus.SUBMITTED, totalScore: 33 },
      { status: EvaluationStatus.SUBMITTED, totalScore: 33 },
    ]);

    expect(result.count).toBe(3);
    // display ปัด 2 ตำแหน่ง
    expect(result.display).toBe('33.33');
    // average ยังเป็นค่าเต็มก่อนปัด (ไม่เท่ากับ 33.33) ใช้เทียบอันดับได้
    expect(result.average).toBe(100 / 3);
    expect(result.average).not.toBe(33.33);
  });
});

describe('formatScoreDisplay', () => {
  it('แสดงทศนิยม 2 ตำแหน่งเสมอ รวมกรณีศูนย์', () => {
    expect(formatScoreDisplay(0)).toBe('0.00');
    expect(formatScoreDisplay(77)).toBe('77.00');
    expect(formatScoreDisplay(82.5)).toBe('82.50');
  });

  it('ปัดเศษแบบครึ่งขึ้น (round half up) แม้ค่าเป็นทศนิยมที่เก็บในเลขฐานสองไม่ตรงเป๊ะ', () => {
    // 1.005 เก็บจริง ~1.004999... ต้องปัดเป็น 1.01 (ไม่ใช่ 1.00)
    expect(formatScoreDisplay(1.005)).toBe('1.01');
    // ปัดลงเมื่อน้อยกว่าครึ่ง
    expect(formatScoreDisplay(33.333333333333336)).toBe('33.33');
    expect(formatScoreDisplay(50.675)).toBe('50.68');
  });
});
