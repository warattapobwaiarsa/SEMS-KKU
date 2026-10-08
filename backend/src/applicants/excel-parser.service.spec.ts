import { Test, TestingModule } from '@nestjs/testing';
import { ExcelParserService } from './excel-parser.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelParserService', () => {
  let service: ExcelParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelParserService],
    }).compile();

    service = module.get<ExcelParserService>(ExcelParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly parse the sample Excel file', async () => {
    const filePath = path.resolve(__dirname, '../../../docs/06-data/import-data-sample.xlsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const buffer = fs.readFileSync(filePath);
    const result = await service.parseBuffer(buffer);

    expect(result.totalRows).toBe(5);
    expect(result.validRows).toBe(5);
    expect(result.invalidRows).toBe(0);
    expect(result.previewRows.length).toBe(5);

    // Verify first applicant row
    const first = result.validApplicants[0];
    expect(first.studentCode).toBe('683040000-1');
    expect(first.phone).toBe('0810000001'); // Auto-prefixed with 0 (BR-IMP-08)
    expect(first.gpa).toBe(3.02);
    expect(first.rawCitizenId).toBe('1410100000001');
    expect(first.maskedCitizenId).toBe('1-4101-XXXXX-XX-1'); // BR-PDP-03: เปิดเผยหลักที่ 1, 2-5 และ 13
    expect(first.supportingInfo.accommodationMapUrl).toBe('https://maps.app.goo.gl/4iM5zfDSZf5jX7WZA');
  });

  it('should reject file without "Data" sheet (BR-IMP-18)', async () => {
    const wb = new (require('exceljs').Workbook)();
    wb.addWorksheet('OtherSheet');
    const buffer = await wb.xlsx.writeBuffer();

    await expect(service.parseBuffer(Buffer.from(buffer))).rejects.toThrow();
  });

  it('should flag duplicate student codes in file (BR-IMP-04)', async () => {
    const filePath = path.resolve(__dirname, '../../../docs/06-data/import-data-sample.xlsx');
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet('Data');

    // Duplicate student code from row 3 into row 4
    const code = sheet.getRow(3).getCell(2).value;
    sheet.getRow(4).getCell(2).value = code;

    const buffer = await wb.xlsx.writeBuffer();
    const result = await service.parseBuffer(Buffer.from(buffer));

    expect(result.validRows).toBe(4);
    expect(result.invalidRows).toBe(1);
    expect(result.invalidRowsDetails[0].errors[0]).toContain('ซ้ำกันภายในไฟล์เดียวกัน');
  });

  it('should flag invalid GPA > 4.00 (BR-IMP-05)', async () => {
    const filePath = path.resolve(__dirname, '../../../docs/06-data/import-data-sample.xlsx');
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet('Data');

    sheet.getRow(3).getCell(10).value = 4.50; // Col 10 is GPA

    const buffer = await wb.xlsx.writeBuffer();
    const result = await service.parseBuffer(Buffer.from(buffer));

    expect(result.invalidRows).toBeGreaterThanOrEqual(1);
    const err = result.invalidRowsDetails.find((d) => d.rowNumber === 3);
    expect(err).toBeDefined();
    expect(err!.errors.some((e) => e.includes('GPA'))).toBe(true);
  });

  it('should stop reading when encountering ending star row (*) (BR-IMP-18)', async () => {
    const filePath = path.resolve(__dirname, '../../../docs/06-data/import-data-sample.xlsx');
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet('Data');

    // Insert ending star row at row 5 (should only parse row 3 and 4)
    sheet.getRow(5).getCell(1).value = '*';
    // Clear rest of row 5
    for (let c = 2; c <= 38; c++) {
      sheet.getRow(5).getCell(c).value = null;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const result = await service.parseBuffer(Buffer.from(buffer));

    // Rows 3 and 4 parsed, stopped at row 5
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(0);
    expect(result.totalRows).toBe(2);
  });

  it('should trim and normalize NBSP / zero-width whitespace from cell values', async () => {
    const filePath = path.resolve(__dirname, '../../../docs/06-data/import-data-sample.xlsx');
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet('Data');

    // Add non-breaking space \u00A0 and zero-width space \u200B to studentCode in row 3
    sheet.getRow(3).getCell(2).value = '\u00A0683040000-1\u200B';

    const buffer = await wb.xlsx.writeBuffer();
    const result = await service.parseBuffer(Buffer.from(buffer));

    const first = result.validApplicants.find((a) => a.rowNumber === 3);
    expect(first).toBeDefined();
    expect(first!.studentCode).toBe('683040000-1');
  });
});
