import { EvaluationStatus } from '@prisma/client';

/**
 * ข้อมูลผลประเมิน 1 แถวที่ใช้คำนวณคะแนนสุดท้ายของผู้สมัคร
 * (ดึงจากตาราง evaluations — เฉพาะค่าที่จำเป็น ไม่ผูกกับ DB)
 */
export interface FinalScoreEvaluation {
  status: EvaluationStatus;
  /** คะแนนรวมที่บันทึกตอน Submit (คอลัมน์ totalScore) */
  totalScore: number | null;
}

/** ผลการคำนวณคะแนนสุดท้ายของผู้สมัคร 1 คน */
export interface FinalScore {
  /**
   * ค่าเฉลี่ย "ก่อนปัดเศษ" — ค่านี้ที่ใช้เทียบตอนจัดอันดับ (เท่ากันค่อยเรียงตามรหัส)
   * ต้องเก็บค่าก่อนปัดไว้เสมอ ห้ามเอาค่า display ไปเทียบ [BR-SCR-05]
   */
  average: number;
  /** จำนวนผลการประเมินที่ SUBMITTED จริง (ไม่มีเลย = 0) [BR-SCR-04] */
  count: number;
  /** ค่าเฉลี่ยสำหรับ "แสดงผล" ปัด 2 ตำแหน่ง เช่น "82.50" [BR-SCR-03] */
  display: string;
}

/**
 * คำนวณคะแนนสุดท้ายของผู้สมัคร 1 คน จากผลประเมินทุกราย [FR-SCR-03]
 *
 * กฎ:
 * - นับเฉพาะผลสถานะ SUBMITTED เท่านั้น — Draft ถูกทิ้ง [FR-SCR-01] [BR-SCR-01]
 * - ค่าเฉลี่ยแบบน้ำหนักเท่ากัน = ผลรวมคะแนนรวม / จำนวนผลที่นับ [BR-SCR-03]
 * - ไม่มีผล SUBMITTED เลย -> average 0, count 0, display "0.00" [BR-SCR-04]
 *
 * เป็น pure function: ไม่แตะฐานข้อมูล ไม่ side effect — เรียกซ้ำกี่ครั้งก็ได้ผลเดิม
 * (ไว้ใช้ซ้ำกับหน้า Admin ผลคะแนนในอนาคต ยังไม่ต่อกับ endpoint ใดๆ)
 */
export function calculateFinalScore(
  evaluations: FinalScoreEvaluation[],
): FinalScore {
  const submitted = evaluations.filter(
    (evaluation) => evaluation.status === EvaluationStatus.SUBMITTED,
  );

  if (submitted.length === 0) {
    return { average: 0, count: 0, display: formatScoreDisplay(0) };
  }

  const sum = submitted.reduce(
    (total, evaluation) => total + (evaluation.totalScore ?? 0),
    0,
  );
  const average = sum / submitted.length;

  return {
    // คืนค่าก่อนปัดเศษไว้สำหรับเทียบอันดับ [BR-SCR-05]
    average,
    count: submitted.length,
    display: formatScoreDisplay(average),
  };
}

/**
 * ปัดเศษค่าคะแนนให้แสดงทศนิยม 2 ตำแหน่งเสมอ เช่น 82.5 -> "82.50", 0 -> "0.00"
 * [FR-SCR-03] [BR-SCR-03]
 *
 * กฎปัดเศษที่ใช้: "ครึ่งขึ้น" (round half up) ที่ตำแหน่งที่ 2 — มาตรฐานการแสดงผลเกรด
 * และเป็นค่าที่ NFR-DAT-06 ระบุว่า "ปัดเฉพาะการแสดงผล" เท่านั้น
 * การเทียบอันดับต้องใช้ average ที่ยังไม่ปัดเสมอ [BR-SCR-05]
 *
 * เทคนิค: บวก Number.EPSILON ก่อนคูณ 100 เพื่อแก้กรณีทศนิยมในเลขฐานสอง
 * เช่น 1.005 ที่เก็บได้จริง 1.004999... จะปัดเป็น 1.01 ได้ถูกต้อง
 * (ค่าเฉลี่ยคะแนนอยู่ช่วง 0-100 จึงพอสำหรับค่า EPSILON)
 */
export function formatScoreDisplay(value: number): string {
  const roundedToTwo = Math.round((value + Number.EPSILON) * 100) / 100;
  return roundedToTwo.toFixed(2);
}
