import { describe, it, expect } from 'vitest';
import { formatErrorMessage, ERROR_MESSAGES } from './error-messages';

describe('formatErrorMessage utility', () => {
  it('should return fallback message if errorCode is undefined', () => {
    expect(formatErrorMessage(undefined, undefined, 'ข้อผิดพลาดเริ่มต้น')).toBe('ข้อผิดพลาดเริ่มต้น');
    expect(formatErrorMessage()).toBe('เกิดข้อผิดพลาดในการทำรายการ');
  });

  it('should return static error message for known errorCode without params', () => {
    expect(formatErrorMessage('ACCOUNT_DEACTIVATED')).toBe(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    expect(formatErrorMessage('ROUND_CLOSED')).toBe(ERROR_MESSAGES.ROUND_CLOSED);
  });

  it('should interpolate single and multiple params into templates correctly', () => {
    const formatted1 = formatErrorMessage('CRITERIA_SUM_NOT_100', { sum: 85 });
    expect(formatted1).toBe('ผลรวมคะแนนสูงสุดปัจจุบันคือ 85 ต้องเท่ากับ 100');

    const formatted2 = formatErrorMessage('INVALID_EXCEL_ROW', { row: 5, reason: 'เกรดเฉลี่ยไม่ถูกต้อง' });
    expect(formatted2).toBe('แถว 5: เกรดเฉลี่ยไม่ถูกต้อง');
  });

  it('should join array params with comma when formatting', () => {
    const formatted = formatErrorMessage('SCORES_INCOMPLETE', { items: ['เกณฑ์ที่ 1', 'เกณฑ์ที่ 2'] });
    expect(formatted).toBe('ยังกรอกคะแนนไม่ครบ ขาดหัวข้อ: เกณฑ์ที่ 1, เกณฑ์ที่ 2');
  });

  it('should return errorCode or fallback if code is not in ERROR_MESSAGES dictionary', () => {
    expect(formatErrorMessage('UNKNOWN_CUSTOM_ERROR')).toBe('UNKNOWN_CUSTOM_ERROR');
    expect(formatErrorMessage('UNKNOWN_CUSTOM_ERROR', undefined, 'ไม่พบข้อผิดพลาดนี้')).toBe('ไม่พบข้อผิดพลาดนี้');
  });
});
