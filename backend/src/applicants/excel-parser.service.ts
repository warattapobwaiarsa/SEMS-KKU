import { Injectable, HttpStatus } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { BusinessException } from '../common/http-exception.filter';
import { maskCitizenId, validateThaiCitizenId } from '../common/crypto.util';

export interface ParsedApplicantData {
  rowNumber: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  phone: string;
  email: string;
  rawCitizenId: string;
  maskedCitizenId: string;
  supportingInfo: {
    applicationDate: string | null;
    accommodation: string | null;
    rent: string | null;
    personalExpense: string | null;
    studyEquipmentCost: string | null;
    electronicDevices: string | null;
    sideIncome: string | null;
    fatherAge: string | null;
    fatherOccupation: string | null;
    fatherIncome: string | null;
    fatherStatus: string | null;
    motherAge: string | null;
    motherOccupation: string | null;
    motherIncome: string | null;
    motherStatus: string | null;
    parentsStatus: string | null;
    tuitionPayer: string | null;
    guardianRelation: string | null;
    guardianOccupation: string | null;
    guardianIncome: string | null;
    siblingsWorking: string | null;
    siblingsNotWorking: string | null;
    siblingsStudying: string | null;
    studentLoan: string | null;
    previousScholarships: string | null;
    accommodationMapUrl: string | null;
  };
}

export interface PreviewRowItem {
  rowNumber: number;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  maskedCitizenId: string;
  isValid: boolean;
  errors: string[];
}

export interface ParseExcelResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  previewRows: PreviewRowItem[];
  validApplicants: ParsedApplicantData[];
  invalidRowsDetails: {
    rowNumber: number;
    studentCode?: string;
    errors: string[];
  }[];
}

const MANDATORY_COLUMNS = [
  'studentCode',
  'titlePrefix',
  'firstName',
  'lastName',
  'faculty',
  'major',
  'studyYear',
  'gpa',
  'phone',
  'email',
  'citizenId',
] as const;

const MANDATORY_TH_NAMES: Record<string, string> = {
  studentCode: 'รหัสนักศึกษา',
  titlePrefix: 'คำนำหน้า',
  firstName: 'ชื่อ',
  lastName: 'สกุล',
  faculty: 'คณะ',
  major: 'สาขา',
  studyYear: 'ชั้นปี',
  gpa: 'GPA',
  phone: 'โทรศัพท์',
  email: 'อีเมล',
  citizenId: 'เลขบัตรประชาชน (CITIZENID)',
};

@Injectable()
export class ExcelParserService {
  async parseBuffer(fileBuffer: Buffer): Promise<ParseExcelResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new BusinessException({
        errorCode: 'INVALID_EXCEL_FILE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไฟล์ไม่ใช่ .xlsx หรือโครงสร้างไฟล์เสียหาย (BR-IMP-02)',
      });
    }

    let worksheet = workbook.getWorksheet('Data');
    if (!worksheet) {
      const targetSheet = workbook.worksheets.find(
        (ws) => ws.name.trim().toLowerCase() === 'data',
      );
      if (targetSheet) {
        worksheet = targetSheet;
      }
    }

    if (!worksheet) {
      throw new BusinessException({
        errorCode: 'EXCEL_MISSING_SHEET_OR_COLUMNS',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไม่พบชีตชื่อ "Data" ในไฟล์ Excel (BR-IMP-18)',
        params: { columns: ['ชีต Data'] },
      });
    }

    const headerRow = worksheet.getRow(2);
    const colIndexMap = this.mapHeaderColumns(headerRow);

    const missingColumns: string[] = [];
    for (const col of MANDATORY_COLUMNS) {
      if (!colIndexMap.has(col)) {
        missingColumns.push(MANDATORY_TH_NAMES[col] || col);
      }
    }

    if (missingColumns.length > 0) {
      throw new BusinessException({
        errorCode: 'EXCEL_MISSING_SHEET_OR_COLUMNS',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `ไม่พบคอลัมน์บังคับในไฟล์: ${missingColumns.join(', ')} (BR-IMP-19)`,
        params: { columns: missingColumns },
      });
    }

    const seenStudentCodes = new Set<string>();
    const previewRows: PreviewRowItem[] = [];
    const validApplicants: ParsedApplicantData[] = [];
    const invalidRowsDetails: {
      rowNumber: number;
      studentCode?: string;
      errors: string[];
    }[] = [];

    const rowCount = worksheet.rowCount;
    for (let r = 3; r <= rowCount; r++) {
      const row = worksheet.getRow(r);

      if (this.isEndingStarRow(row)) {
        break;
      }

      if (this.isRowEmpty(row)) {
        continue;
      }

      const rowErrors: string[] = [];
      const parsedRow = this.extractRowData(row, r, colIndexMap, rowErrors);

      if (parsedRow.studentCode) {
        if (seenStudentCodes.has(parsedRow.studentCode)) {
          rowErrors.push(
            `รหัสนักศึกษา ${parsedRow.studentCode} ซ้ำกันภายในไฟล์เดียวกัน (BR-IMP-04)`,
          );
        } else {
          seenStudentCodes.add(parsedRow.studentCode);
        }
      }

      const isValid = rowErrors.length === 0;

      previewRows.push({
        rowNumber: r,
        studentCode: parsedRow.studentCode,
        titlePrefix: parsedRow.titlePrefix,
        firstName: parsedRow.firstName,
        lastName: parsedRow.lastName,
        faculty: parsedRow.faculty,
        major: parsedRow.major,
        studyYear: parsedRow.studyYear,
        gpa: parsedRow.gpa,
        maskedCitizenId: maskCitizenId(parsedRow.rawCitizenId),
        isValid,
        errors: rowErrors,
      });

      if (isValid) {
        validApplicants.push(parsedRow);
      } else {
        invalidRowsDetails.push({
          rowNumber: r,
          studentCode: parsedRow.studentCode || undefined,
          errors: rowErrors,
        });
      }
    }

    const totalRows = previewRows.length;
    const validRows = validApplicants.length;
    const invalidRows = invalidRowsDetails.length;

    return {
      totalRows,
      validRows,
      invalidRows,
      previewRows,
      validApplicants,
      invalidRowsDetails,
    };
  }

  private isEndingStarRow(row: ExcelJS.Row): boolean {
    let hasStar = false;
    let otherValues = 0;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = this.getRawCellValue(cell);
      if (val !== null && val !== undefined) {
        const strVal = String(val).trim();
        if (strVal === '*' && (colNumber === 1 || colNumber === 2)) {
          hasStar = true;
        } else if (strVal !== '') {
          otherValues++;
        }
      }
    });

    return hasStar && otherValues === 0;
  }

  private isRowEmpty(row: ExcelJS.Row): boolean {
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = this.getRawCellValue(cell);
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        hasValue = true;
      }
    });
    return !hasValue;
  }

  private mapHeaderColumns(headerRow: ExcelJS.Row): Map<string, number> {
    const map = new Map<string, number>();
    const totalCols = headerRow.cellCount || 50;

    for (let c = 1; c <= totalCols; c++) {
      const raw = this.getRawCellValue(headerRow.getCell(c));
      const val = raw ? String(raw).trim().toLowerCase() : '';

      if (!val) continue;

      if (val === 'ลำดับ') map.set('legacySeq', c);
      else if (val === 'รหัส' || val === 'รหัสนักศึกษา')
        map.set('studentCode', c);
      else if (val === 'คำนำหน้า' || val === 'คำนำหน้านาม')
        map.set('titlePrefix', c);
      else if (val === 'ชือ' || val === 'ชื่อ') map.set('firstName', c);
      else if (val === 'สกุล' || val === 'นามสกุล') map.set('lastName', c);
      else if (val === 'คณะ') map.set('faculty', c);
      else if (val === 'สาขา' || val === 'สาขาวิชา') map.set('major', c);
      else if (val === 'ชั้นปี') map.set('studyYear', c);
      else if (val === 'วันที่สมัคร') map.set('applicationDate', c);
      else if (val === 'gpa' || val === 'เกรดเฉลี่ย') map.set('gpa', c);
      else if (
        val === 'โทรศัพท์' ||
        val === 'เบอร์โทรศัพท์' ||
        val === 'เบอร์โทร'
      )
        map.set('phone', c);
      else if (val === 'อีเมล์' || val === 'อีเมล') map.set('email', c);
      else if (val === 'ที่พัก') map.set('accommodation', c);
      else if (val.includes('ค่าเช่า')) map.set('rent', c);
      else if (val.includes('ค่าใช้จ่ายส่วนตัว')) map.set('personalExpense', c);
      else if (val.includes('ค่าอุปกรณ์การศึกษา'))
        map.set('studyEquipmentCost', c);
      else if (val.includes('อุปกรณ์อิเล็กทรอนิกส์'))
        map.set('electronicDevices', c);
      else if (val.includes('รายได้เสริม')) map.set('sideIncome', c);
      else if (val === 'บิดา อายุ') map.set('fatherAge', c);
      else if (val === 'บิดา อาชีพ') map.set('fatherOccupation', c);
      else if (val === 'บิดา รายได้') map.set('fatherIncome', c);
      else if (val === 'บิดา สภาพ') map.set('fatherStatus', c);
      else if (val === 'มารดา อายุ') map.set('motherAge', c);
      else if (val === 'มารดา อาชีพ') map.set('motherOccupation', c);
      else if (val === 'มารดา รายได้') map.set('motherIncome', c);
      else if (val === 'มารดา สภาพ') map.set('motherStatus', c);
      else if (val.includes('สภาพบิดา-มารดา')) map.set('parentsStatus', c);
      else if (val.includes('คนออกเงินเรียน')) map.set('tuitionPayer', c);
      else if (val === 'อุปการะ-ความเกี่ยวข้อง') map.set('guardianRelation', c);
      else if (val === 'อุปการะ-อาชีพ') map.set('guardianOccupation', c);
      else if (val === 'อุปการะ-รายได้') map.set('guardianIncome', c);
      else if (val === 'พี่น้อง-ทำงาน') map.set('siblingsWorking', c);
      else if (val === 'พี่น้อง-ไม่ทำงาน') map.set('siblingsNotWorking', c);
      else if (val === 'พี่น้อง-เรียน') map.set('siblingsStudying', c);
      else if (val === 'กยศ') map.set('studentLoan', c);
      else if (val === 'ทุน') map.set('previousScholarships', c);
      else if (val.includes('แผนที่') || val.includes('maps'))
        map.set('accommodationMapUrl', c);
      else if (
        val === 'citizenid' ||
        val === 'เลขบัตรประชาชน' ||
        val === 'เลขประจำตัวประชาชน'
      ) {
        map.set('citizenId', c);
      }
    }

    if (!map.has('accommodationMapUrl')) {
      const citizenIdCol = map.get('citizenId');
      const scholarshipsCol = map.get('previousScholarships');
      if (
        citizenIdCol &&
        scholarshipsCol &&
        citizenIdCol - scholarshipsCol === 2
      ) {
        map.set('accommodationMapUrl', scholarshipsCol + 1);
      }
    }

    return map;
  }

  private extractRowData(
    row: ExcelJS.Row,
    rowNumber: number,
    colMap: Map<string, number>,
    errors: string[],
  ): ParsedApplicantData {
    const getString = (key: string): string => {
      const idx = colMap.get(key);
      if (!idx) return '';
      const cell = row.getCell(idx);
      const val = this.getRawCellValue(cell);
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/[\u00A0\u200B\uFEFF]/g, ' ')
        .trim();
    };

    const getNullableString = (key: string): string | null => {
      const s = getString(key);
      return s ? s : null;
    };

    let legacySeq: number | null = null;
    const rawSeq = getString('legacySeq');
    if (rawSeq) {
      const seqNum = Number(rawSeq);
      if (Number.isInteger(seqNum) && seqNum > 0) {
        legacySeq = seqNum;
      } else {
        errors.push(
          `คอลัมน์ "ลำดับ" ต้องเป็นจำนวนเต็มบวก (พบ: "${rawSeq}") (BR-IMP-20)`,
        );
      }
    }

    const studentCode = getString('studentCode');
    if (!studentCode) {
      errors.push('รหัสนักศึกษาห้ามเว้นว่าง (BR-IMP-03)');
    }

    const titlePrefix = getString('titlePrefix');
    if (!titlePrefix) {
      errors.push('คำนำหน้าห้ามเว้นว่าง (BR-IMP-03)');
    }

    const firstName = getString('firstName');
    if (!firstName) {
      errors.push('ชื่อห้ามเว้นว่าง (BR-IMP-03)');
    }

    const lastName = getString('lastName');
    if (!lastName) {
      errors.push('สกุลห้ามเว้นว่าง (BR-IMP-03)');
    }

    const faculty = getString('faculty');
    if (!faculty) {
      errors.push('คณะห้ามเว้นว่าง (BR-IMP-03)');
    }

    const major = getString('major');
    if (!major) {
      errors.push('สาขาห้ามเว้นว่าง (BR-IMP-03)');
    }

    const rawStudyYear = getString('studyYear');
    let studyYear = 0;
    if (!rawStudyYear) {
      errors.push('ชั้นปีห้ามเว้นว่าง (BR-IMP-03)');
    } else {
      const y = Number(rawStudyYear);
      if (Number.isInteger(y) && y >= 1 && y <= 6) {
        studyYear = y;
      } else {
        errors.push(
          `ชั้นปีต้องเป็นจำนวนเต็ม 1–6 (พบ: "${rawStudyYear}") (BR-IMP-07)`,
        );
      }
    }

    const rawGpa = getString('gpa');
    let gpa = 0;
    if (!rawGpa) {
      errors.push('GPA ห้ามเว้นว่าง (BR-IMP-03)');
    } else {
      const g = parseFloat(rawGpa);
      if (isNaN(g) || g < 0.0 || g > 4.0) {
        errors.push(
          `GPA ต้องอยู่ในช่วง 0.00–4.00 (พบ: "${rawGpa}") (BR-IMP-05)`,
        );
      } else {
        gpa = parseFloat(g.toFixed(2));
      }
    }

    let rawPhone = getString('phone').replace(/[\s-]/g, '');
    if (!rawPhone) {
      errors.push('โทรศัพท์ห้ามเว้นว่าง (BR-IMP-03)');
    } else {
      if (
        rawPhone.length === 9 &&
        (rawPhone.startsWith('6') ||
          rawPhone.startsWith('8') ||
          rawPhone.startsWith('9'))
      ) {
        rawPhone = '0' + rawPhone;
      }
      if (!/^0\d{8,9}$/.test(rawPhone)) {
        errors.push(
          `โทรศัพท์ต้องเป็นตัวเลข 9–10 หลักขึ้นต้นด้วย 0 (พบ: "${rawPhone}") (BR-IMP-08)`,
        );
      }
    }
    const phone = rawPhone;

    const email = getString('email');
    if (!email) {
      errors.push('อีเมลห้ามเว้นว่าง (BR-IMP-03)');
    }

    const rawCitizenId = getString('citizenId').replace(/[\s-]/g, '');
    if (!rawCitizenId) {
      errors.push('เลขบัตรประชาชนห้ามเว้นว่าง (BR-IMP-03)');
    } else if (!validateThaiCitizenId(rawCitizenId)) {
      const maskedDisplay =
        rawCitizenId.length >= 4
          ? `xxxx-xxxx-${rawCitizenId.slice(-4)}`
          : 'xxxxxxxxxxxxx';
      errors.push(
        `เลขบัตรประชาชนไม่ถูกต้อง ต้องเป็นตัวเลข 13 หลักและผ่านการตรวจสอบ Checksum (พบ: "${maskedDisplay}") (BR-IMP-06)`,
      );
    }

    let applicationDate: string | null = null;
    const dateIdx = colMap.get('applicationDate');
    if (dateIdx) {
      const cell = row.getCell(dateIdx);
      applicationDate = this.formatApplicationDate(cell);
    }

    const accommodationMapUrl = getNullableString('accommodationMapUrl');
    if (accommodationMapUrl) {
      if (
        !accommodationMapUrl.startsWith('http://') &&
        !accommodationMapUrl.startsWith('https://')
      ) {
        errors.push(
          `ลิงก์แผนที่ที่พักต้องขึ้นต้นด้วย http:// หรือ https:// เท่านั้น (BR-IMP-22)`,
        );
      }
    }

    const supportingInfo = {
      applicationDate,
      accommodation: getNullableString('accommodation'),
      rent: getNullableString('rent'),
      personalExpense: getNullableString('personalExpense'),
      studyEquipmentCost: getNullableString('studyEquipmentCost'),
      electronicDevices: getNullableString('electronicDevices'),
      sideIncome: getNullableString('sideIncome'),
      fatherAge: getNullableString('fatherAge'),
      fatherOccupation: getNullableString('fatherOccupation'),
      fatherIncome: getNullableString('fatherIncome'),
      fatherStatus: getNullableString('fatherStatus'),
      motherAge: getNullableString('motherAge'),
      motherOccupation: getNullableString('motherOccupation'),
      motherIncome: getNullableString('motherIncome'),
      motherStatus: getNullableString('motherStatus'),
      parentsStatus: getNullableString('parentsStatus'),
      tuitionPayer: getNullableString('tuitionPayer'),
      guardianRelation: getNullableString('guardianRelation'),
      guardianOccupation: getNullableString('guardianOccupation'),
      guardianIncome: getNullableString('guardianIncome'),
      siblingsWorking: getNullableString('siblingsWorking'),
      siblingsNotWorking: getNullableString('siblingsNotWorking'),
      siblingsStudying: getNullableString('siblingsStudying'),
      studentLoan: getNullableString('studentLoan'),
      previousScholarships: getNullableString('previousScholarships'),
      accommodationMapUrl,
    };

    return {
      rowNumber,
      legacySeq,
      studentCode,
      titlePrefix,
      firstName,
      lastName,
      faculty,
      major,
      studyYear,
      gpa,
      phone,
      email,
      rawCitizenId,
      maskedCitizenId: maskCitizenId(rawCitizenId),
      supportingInfo,
    };
  }

  private formatApplicationDate(cell: ExcelJS.Cell): string | null {
    const raw = this.getRawCellValue(cell);
    if (!raw) return null;

    if (raw instanceof Date) {
      const day = String(raw.getDate()).padStart(2, '0');
      const month = String(raw.getMonth() + 1).padStart(2, '0');
      const beYear = raw.getFullYear() + 543;
      const hours = String(raw.getHours()).padStart(2, '0');
      const minutes = String(raw.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${beYear} ${hours}:${minutes}`;
    }

    return String(raw).trim() || null;
  }

  private getRawCellValue(
    cell: ExcelJS.Cell,
  ): string | number | boolean | Date | null {
    if (!cell || cell.value === null || cell.value === undefined) {
      return null;
    }

    const val = cell.value;
    if (typeof val === 'number') {
      // Prevent scientific notation for large integers (e.g. 1.4101e+12)
      if (Number.isInteger(val)) {
        return BigInt(val).toString();
      }
      return val;
    }
    if (typeof val === 'string' || typeof val === 'boolean') {
      return val;
    }
    if (val instanceof Date) {
      return val;
    }
    if (typeof val === 'object') {
      // ExcelJS hyperlink cell { text: '...', hyperlink: '...' }
      if (
        'text' in val &&
        typeof (val as { text: unknown }).text === 'string'
      ) {
        return (val as { text: string }).text;
      }
      if (
        'hyperlink' in val &&
        typeof (val as { hyperlink: unknown }).hyperlink === 'string'
      ) {
        return (val as { hyperlink: string }).hyperlink;
      }
      // ExcelJS rich text
      if (
        'richText' in val &&
        Array.isArray((val as { richText: unknown[] }).richText)
      ) {
        return val.richText.map((r) => r.text).join('');
      }
      // ExcelJS formula result
      if ('result' in val) {
        const res = (val as { result: unknown }).result;
        if (
          typeof res === 'string' ||
          typeof res === 'number' ||
          typeof res === 'boolean'
        ) {
          return res;
        }
        if (res instanceof Date) {
          return res;
        }
      }
    }

    return null;
  }
}
