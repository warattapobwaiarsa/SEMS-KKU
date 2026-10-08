/**
 * Error Messages & Semantic Error Code Mapping
 * ตามข้อกำหนด BR-SYS-01 และตาราง 2.3 ของ SEMS REST API Specification
 */

export interface ErrorParams {
  [key: string]: unknown;
}

export const ERROR_MESSAGES: Record<string, string> = {
  // MSG-01 ถึง MSG-33 ตามสเปก BR-SYS-01
  ACCOUNT_DEACTIVATED: 'ไม่สามารถเข้าสู่ระบบได้ บัญชีไม่ได้รับสิทธิ์หรือถูกปิดการใช้งาน',
  CANNOT_DEACTIVATE_EVALUATOR_WITH_DRAFT: 'ไม่สามารถปิดบัญชีได้ ผู้ประเมินยังมีผลการประเมินสถานะ Draft ในรอบทุนที่เปิดอยู่',
  CANNOT_DEACTIVATE_SELF_OR_LAST_ADMIN: 'ไม่สามารถปิดบัญชีของตนเองหรือบัญชี Admin คนสุดท้ายได้',
  EXPIRY_DAYS_REQUIRED: 'กรุณากำหนดวันหมดอายุใหม่ก่อนเปิดใช้งานบัญชีนี้',
  CRITERIA_SUM_NOT_100: 'ผลรวมคะแนนสูงสุดปัจจุบันคือ {sum} ต้องเท่ากับ 100',
  MAX_SCORE_OUT_OF_RANGE: 'คะแนนสูงสุดต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 100',
  SCORED_CRITERIA_REQUIRED: 'เกณฑ์ต้องมีเกณฑ์ย่อยแบบมีคะแนนอย่างน้อย 1 ข้อ',
  CRITERIA_LOCKED: 'เกณฑ์นี้ถูกใช้ในรอบทุนที่เปิดแล้ว หรือรอบทุนไม่อยู่ในสถานะ Draft จึงแก้ไขไม่ได้',
  ROUND_OPEN_PRECHECK_FAILED: 'ไม่สามารถเปิดรอบได้ เนื่องจาก: {reasons}',
  INVALID_EXCEL_FILE: 'ไฟล์ไม่ถูกต้อง ต้องเป็น .xlsx ขนาดไม่เกิน 50 MB และมีคอลัมน์ครบ',
  FILE_TOO_LARGE: 'ไฟล์ไม่ถูกต้อง ต้องเป็น .xlsx ขนาดไม่เกิน 50 MB และมีคอลัมน์ครบ',
  INVALID_EXCEL_ROW: 'แถว {row}: {reason}',
  EXCEL_NO_VALID_ROWS: 'ไม่มีแถวที่ผ่านการตรวจสอบ ไม่สามารถนำเข้าได้',
  EXCEL_INVALID_ROWS_ACK_REQUIRED: 'มี {count} แถวที่ไม่ผ่านการตรวจสอบและจะไม่ถูกนำเข้า กรุณากดรับทราบ',
  SCORE_OUT_OF_RANGE: 'คะแนนต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง {max}',
  SCORES_INCOMPLETE: 'ยังกรอกคะแนนไม่ครบ ขาดหัวข้อ: {items}',
  ALREADY_EVALUATED: 'คุณประเมินผู้สมัครรายนี้ในรอบทุนนี้แล้ว',
  EVALUATOR_EXPIRED_NEW_APPLICANT: 'บัญชีของคุณหมดอายุแล้ว สามารถแก้ไขและส่งได้เฉพาะผลการประเมิน Draft เดิมเท่านั้น',
  ROUND_CLOSED: 'รอบทุนนี้ถูกปิดแล้ว ไม่สามารถบันทึกหรือส่งผลการประเมินได้ กรุณาติดต่อ Admin',
  ROUND_CLOSE_STATE_CHANGED: 'จำนวนผู้สมัครที่ไม่มีผลเปลี่ยนไปจากที่รับทราบ ต้องตรวจเช็คใหม่',
  ROUND_CLOSE_ACK_REQUIRED: 'มีผู้สมัคร {count} รายที่ยังไม่มีผลการประเมินสถานะ Submitted กรุณากดรับทราบก่อนปิดรอบ',
  BUDGET_MUST_BE_POSITIVE: 'งบประมาณรวมต้องมากกว่า 0 บาท',
  CANNOT_EDIT_BUDGET_ALLOCATED: 'ไม่สามารถแก้ไขงบประมาณรวมได้ เนื่องจากมียอดจัดสรรแล้ว {allocated} บาท',
  ALLOCATION_EXCEEDS_BUDGET: 'ยอดจัดสรรรวมจะเป็น {total} บาท เกินงบประมาณ {budget} บาท',
  ALLOCATION_AMOUNT_MISMATCH: 'จำนวนเงินไม่สอดคล้องกับสถานะการได้รับทุน (ได้รับทุนต้อง > 0, ไม่ได้รับทุนต้องเป็น 0) และต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง',
  ZERO_SCORE_CANNOT_AWARD: 'ผู้สมัครที่มีคะแนนสุดท้าย 0 ไม่สามารถกำหนดเป็นผู้ได้รับทุนได้',
  ALLOCATION_LOCKED_FINALIZED: 'ผลการจัดสรรอยู่ในสถานะ Finalized ต้องเปิดกลับมาแก้ไขก่อน',
  INVALID_ROUND_STATUS: 'ไม่สามารถดำเนินการได้ในสถานะปัจจุบัน ({status})',
  INVALID_ALLOCATION_STATUS: 'ไม่สามารถดำเนินการได้ในสถานะปัจจุบัน ({status})',
  SESSION_REPLACED: 'เซสชันสิ้นสุดหรือมีการเข้าใช้งานจากเครื่องอื่น ข้อมูลที่บันทึกอัตโนมัติไว้แล้วยังคงอยู่',
  SESSION_IDLE_TIMEOUT: 'เซสชันหมดเวลาเนื่องจากไม่มีการใช้งานเกิน 60 นาที',
  EMAIL_ALREADY_EXISTS_OR_INVALID: 'บัญชีต้องเป็นอีเมล @kku.ac.th หรือ @kkumail.com และต้องไม่ซ้ำกับผู้ใช้อื่น',
  VALIDITY_DAYS_INVALID: 'กรุณากำหนดอายุการใช้งานเป็นจำนวนวัน (จำนวนเต็มบวก)',
  CRITERIA_NAME_DUPLICATE: 'ชื่อเกณฑ์การประเมินนี้มีอยู่แล้ว',
  EXCEL_MISSING_SHEET_OR_COLUMNS: 'ไม่พบชีต Data หรือขาดคอลัมน์บังคับ',
  ACADEMIC_YEAR_OUT_OF_RANGE: 'ปีการศึกษาต้องเป็น พ.ศ. 2550–2700',
  SEMESTER_OUT_OF_RANGE: 'ภาคเรียนต้องเป็น 1 หรือ 2',

  // System & HTTP Errors
  BAD_REQUEST: 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
  RATE_LIMITED: 'เรียกคำขอเกินความถี่ที่ระบบอนุญาต กรุณารอสักครู่',
  CSRF_REJECTED: 'คำขอไม่ถูกต้อง (CSRF Validation Failed)',
  UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
  FORBIDDEN: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
  NOT_FOUND: 'ไม่พบข้อมูลที่ระบุในระบบ',
  PREVIEW_TOKEN_INVALID: 'โทเค็นตัวอย่างไม่ถูกต้อง หรือเป็นของผู้ใช้อื่น',
  PREVIEW_TOKEN_EXPIRED: 'โทเค็นตัวอย่างหมดอายุ กรุณาอัปโหลดไฟล์ใหม่อีกครั้ง',
  PREVIEW_TOKEN_ALREADY_USED: 'โทเค็นนี้ถูกนำเข้าหรือยกเลิกไปแล้ว',
  STALE_VERSION: 'ข้อมูลถูกเปลี่ยนแปลงโดยผู้ใช้อื่นแล้ว กรุณารีเฟรชหน้าจอ',
  UNIQUE_CONSTRAINT_FAILED: 'ข้อมูลซ้ำกับที่มีอยู่ในระบบ',
  FOREIGN_KEY_CONSTRAINT_FAILED: 'ไม่สามารถดำเนินการได้เนื่องจากมีข้อมูลอื่นเชื่อมโยงอยู่',
};

/**
 * แปลง errorCode และ params ให้เป็นข้อความภาษาไทย
 */
export function formatErrorMessage(
  errorCode?: string,
  params?: ErrorParams,
  fallbackMessage?: string,
): string {
  if (!errorCode) {
    return fallbackMessage || 'เกิดข้อผิดพลาดในการทำรายการ';
  }

  let template = ERROR_MESSAGES[errorCode];

  if (!template) {
    return fallbackMessage || errorCode;
  }

  // แทนที่ตัวแปรใน template เช่น {sum}, {row}, {reason}
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), displayVal);
    });
  }

  return template;
}
