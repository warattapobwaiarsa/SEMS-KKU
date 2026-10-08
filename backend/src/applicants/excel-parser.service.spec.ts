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
});
