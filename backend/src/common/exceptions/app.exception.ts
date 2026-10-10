import { HttpException } from '@nestjs/common';

/**
 * คลาสสำหรับ "โยน error ทางธุรกิจ" ที่ระบุ errorCode ตามมาตรฐาน
 * ของ REST API spec หัวข้อ 2.2 (Error Response) และตารางในหัวข้อ 2.3
 *
 * ตัวอย่างการใช้ใน Service (จะใช้จริงในขั้นถัดไป):
 *
 *   throw new AppException(
 *     'SCORES_INCOMPLETE',
 *     HttpStatus.UNPROCESSABLE_ENTITY,
 *     { items: ['สถานะครอบครัวและรายได้ครัวเรือน'] },
 *   );
 *
 * GlobalExceptionFilter จะจับ error นี้แล้วแปลงให้เป็น error envelope
 * ให้อัตโนมัติ จึงไม่ต้องจัดรูปแบบ response เองในที่ต่างๆ
 */
export class AppException extends HttpException {
  /** รหัส error เชิงความหมาย เช่น SCORES_INCOMPLETE, NOT_FOUND (ตาม spec หัวข้อ 2.3) */
  public readonly errorCode: string;

  /** ค่าเสริมที่ส่งกลับให้ client ใช้แสดงผล เช่น { sum: 85 } */
  public readonly params?: Record<string, unknown>;

  constructor(
    errorCode: string,
    statusCode: number,
    params?: Record<string, unknown>,
  ) {
    super({ errorCode, params, message: errorCode }, statusCode);
    this.errorCode = errorCode;
    this.params = params;
  }
}
