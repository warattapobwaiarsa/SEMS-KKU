import {
  Injectable,
  NotFoundException,
  HttpStatus,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExcelParserService, ParseExcelResult } from './excel-parser.service';
import { ConfirmImportDto } from './dto/import-applicant.dto';
import { QueryApplicantDto } from './dto/query-applicant.dto';
import { BusinessException } from '../common/http-exception.filter';
import { encryptCitizenId } from '../common/crypto.util';
import { RoundStatus, AuditAction, Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

interface StoredPreviewData extends ParseExcelResult {
  previewToken: string;
  roundId: number;
  fileName: string;
  createdAt: number;
  expiresAt: Date;
  isUsed: boolean;
}

@Injectable()
export class ApplicantsService implements OnModuleDestroy {
  private readonly logger = new Logger(ApplicantsService.name);
  private readonly previewStorage = new Map<string, StoredPreviewData>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelParserService: ExcelParserService,
  ) {
    // Run cleanup every 5 minutes to purge expired previews (BR-IMP-16)
    this.cleanupInterval = setInterval(() => {
      this.purgeExpiredPreviews();
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  private purgeExpiredPreviews() {
    const now = Date.now();
    for (const [token, data] of this.previewStorage.entries()) {
      if (data.expiresAt.getTime() <= now || data.isUsed) {
        this.previewStorage.delete(token);
      }
    }
  }

  async previewExcel(
    roundId: number,
    file: Express.Multer.File,
  ) {
    // BR-IMP-01: Round must be in DRAFT status
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    if (round.status !== RoundStatus.DRAFT) {
      throw new BusinessException({
        errorCode: 'INVALID_ROUND_STATUS',
        statusCode: HttpStatus.CONFLICT,
        message: 'นำเข้าได้เฉพาะรอบสถานะ Draft รอบ Open/Closed นำเข้าไม่ได้ (BR-IMP-01)',
        params: { status: round.status, action: 'import_applicants' },
      });
    }

    // BR-IMP-02: File size <= 50MB
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_SIZE) {
      throw new BusinessException({
        errorCode: 'FILE_TOO_LARGE',
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'ไฟล์อัปโหลดขนาดเกิน 50 MB (BR-IMP-02)',
        params: { maxSize: '50MB' },
      });
    }

    // Parse Excel with ExcelParserService
    const parseResult = await this.excelParserService.parseBuffer(file.buffer);

    const previewToken = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    this.previewStorage.set(previewToken, {
      ...parseResult,
      previewToken,
      roundId,
      fileName: file.originalname,
      createdAt: Date.now(),
      expiresAt,
      isUsed: false,
    });

    return {
      previewToken,
      fileName: file.originalname,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      invalidRows: parseResult.invalidRows,
      expiresAt: expiresAt.toISOString(),
      rows: parseResult.previewRows,
    };
  }

  async confirmImport(
    roundId: number,
    dto: ConfirmImportDto,
    actorId?: number,
  ) {
    // 1. Verify round is in DRAFT status
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    if (round.status !== RoundStatus.DRAFT) {
      throw new BusinessException({
        errorCode: 'INVALID_ROUND_STATUS',
        statusCode: HttpStatus.CONFLICT,
        message: 'นำเข้าได้เฉพาะรอบสถานะ Draft รอบ Open/Closed นำเข้าไม่ได้ (BR-IMP-01)',
        params: { status: round.status, action: 'import_applicants' },
      });
    }

    // 2. Verify token
    const previewData = this.previewStorage.get(dto.previewToken);
    if (!previewData || previewData.roundId !== roundId) {
      throw new BusinessException({
        errorCode: 'PREVIEW_TOKEN_INVALID',
        statusCode: HttpStatus.NOT_FOUND,
        message: 'โทเค็นพรีวิวไม่ถูกต้องหรือไม่ตรงกับรอบทุน (BR-IMP-11)',
      });
    }

    if (previewData.isUsed) {
      throw new BusinessException({
        errorCode: 'PREVIEW_TOKEN_ALREADY_USED',
        statusCode: HttpStatus.GONE,
        message: 'โทเค็นพรีวิวถูกนำเข้าหรือใช้งานไปแล้ว (BR-IMP-16)',
      });
    }

    if (previewData.expiresAt.getTime() <= Date.now()) {
      this.previewStorage.delete(dto.previewToken);
      throw new BusinessException({
        errorCode: 'PREVIEW_TOKEN_EXPIRED',
        statusCode: HttpStatus.GONE,
        message: 'โทเค็นพรีวิวหมดอายุ (อายุ 30 นาที) กรุณาอัปโหลดไฟล์ใหม่ (BR-IMP-11)',
      });
    }

    // 3. Verify valid rows count
    if (previewData.validRows === 0) {
      throw new BusinessException({
        errorCode: 'EXCEL_NO_VALID_ROWS',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไม่มีแถวใดผ่านการตรวจสอบ ห้ามยืนยันนำเข้า (BR-IMP-12)',
      });
    }

    // 4. Verify acknowledgment if invalid rows exist (BR-IMP-11)
    if (previewData.invalidRows > 0 && !dto.acknowledgedInvalidRows) {
      throw new BusinessException({
        errorCode: 'EXCEL_INVALID_ROWS_ACK_REQUIRED',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `พบข้อมูลไม่ผ่านการตรวจสอบจำนวน ${previewData.invalidRows} แถว ต้องกดยืนยันรับทราบก่อนนำเข้า (BR-IMP-11)`,
        params: { count: previewData.invalidRows },
      });
    }

    // Find actor or default admin user
    let effectiveActorId = actorId;
    if (!effectiveActorId) {
      const defaultAdmin = await this.prisma.user.findFirst({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });
      if (defaultAdmin) {
        effectiveActorId = defaultAdmin.id;
      }
    }

    if (!effectiveActorId) {
      throw new BusinessException({
        errorCode: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'ไม่พบผู้ดำเนินการนำเข้าข้อมูล',
      });
    }

    // Mark token as used immediately
    previewData.isUsed = true;

    // 5. Execute Atomic Transaction with 60s timeout (BR-IMP-13)
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-verify round status within transaction to eliminate race conditions
      const lockedRound = await tx.scholarshipRound.findUnique({
        where: { id: roundId },
        select: { status: true },
      });

      if (!lockedRound || lockedRound.status !== RoundStatus.DRAFT) {
        throw new BusinessException({
          errorCode: 'INVALID_ROUND_STATUS',
          statusCode: HttpStatus.CONFLICT,
          message: 'นำเข้าได้เฉพาะรอบสถานะ Draft รอบ Open/Closed นำเข้าไม่ได้ (BR-IMP-01)',
          params: { status: lockedRound?.status, action: 'import_applicants' },
        });
      }

      // Delete existing applicants and related data for this round
      // Cascade handles applicant_contacts and applicant_supporting_info
      await tx.applicant.deleteMany({
        where: { roundId },
      });

      // Create ImportBatch
      const importBatch = await tx.importBatch.create({
        data: {
          roundId,
          fileName: previewData.fileName,
          totalRows: previewData.totalRows,
          validRows: previewData.validRows,
          invalidRows: previewData.invalidRows,
          errorDetails: previewData.invalidRowsDetails.length > 0
            ? (previewData.invalidRowsDetails as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          importedById: effectiveActorId,
        },
      });

      // Insert all valid applicants with encrypted contacts and supporting info
      for (const applicantData of previewData.validApplicants) {
        const encryptedCitizenId = encryptCitizenId(applicantData.rawCitizenId);

        const createdApplicant = await tx.applicant.create({
          data: {
            roundId,
            importBatchId: importBatch.id,
            legacySeq: applicantData.legacySeq,
            studentCode: applicantData.studentCode,
            titlePrefix: applicantData.titlePrefix,
            firstName: applicantData.firstName,
            lastName: applicantData.lastName,
            faculty: applicantData.faculty,
            major: applicantData.major,
            studyYear: applicantData.studyYear,
            gpa: new Prisma.Decimal(applicantData.gpa),
          },
        });

        await tx.applicantContact.create({
          data: {
            applicantId: createdApplicant.id,
            phone: applicantData.phone,
            email: applicantData.email,
            citizenIdEncrypted: encryptedCitizenId,
            citizenIdMasked: applicantData.maskedCitizenId,
          },
        });

        await tx.applicantSupportingInfo.create({
          data: {
            applicantId: createdApplicant.id,
            ...applicantData.supportingInfo,
          },
        });
      }

      // Log Audit action (IMPORT_APPLICANTS)
      await tx.auditLog.create({
        data: {
          actorId: effectiveActorId,
          action: AuditAction.IMPORT_APPLICANTS,
          entityType: 'ScholarshipRound',
          entityId: String(roundId),
          roundId,
          newValue: {
            importBatchId: importBatch.id,
            fileName: previewData.fileName,
            totalRows: previewData.totalRows,
            validRows: previewData.validRows,
            invalidRows: previewData.invalidRows,
          },
        },
      });

      return {
        importBatchId: importBatch.id,
        importedCount: previewData.validRows,
        skippedCount: previewData.invalidRows,
      };
    }, {
      timeout: 60000,
      maxWait: 10000,
    });

    // Clean up temporary preview from storage (BR-IMP-16)
    this.previewStorage.delete(dto.previewToken);

    return result;
  }

  async cancelPreview(roundId: number, previewToken: string) {
    const previewData = this.previewStorage.get(previewToken);
    if (previewData && previewData.roundId === roundId) {
      this.previewStorage.delete(previewToken);
    }
    return { success: true, message: 'Preview discarded successfully' };
  }

  async findAll(roundId: number, query: QueryApplicantDto, userRole?: string) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    // IDOR Protection: Evaluator can only see applicants in OPEN rounds
    if (userRole === 'EVALUATOR' && round.status !== RoundStatus.OPEN) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบรอบทุนที่เปิดรับประเมิน',
      });
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicantWhereInput = { roundId };

    if (query.faculty) {
      where.faculty = query.faculty;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { studentCode: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ApplicantOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'legacySeq';
    const sortDirection = query.sortOrder === 'desc' ? 'desc' : 'asc';

    if (sortField === 'gpa') {
      orderBy.gpa = sortDirection;
    } else if (sortField === 'studentCode') {
      orderBy.studentCode = sortDirection;
    } else if (sortField === 'firstName') {
      orderBy.firstName = sortDirection;
    } else {
      orderBy.legacySeq = sortDirection;
    }

    const [total, items] = await Promise.all([
      this.prisma.applicant.count({ where }),
      this.prisma.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const formatted = items.map((item) => ({
      id: item.id,
      roundId: item.roundId,
      importBatchId: item.importBatchId,
      legacySeq: item.legacySeq,
      studentCode: item.studentCode,
      titlePrefix: item.titlePrefix,
      firstName: item.firstName,
      lastName: item.lastName,
      faculty: item.faculty,
      major: item.major,
      studyYear: item.studyYear,
      gpa: Number(item.gpa),
      createdAt: item.createdAt,
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userRole?: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      include: {
        round: true,
        contact: true,
        supportingInfo: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบข้อมูลผู้สมัครรหัส ${id}`,
      });
    }

    // IDOR Protection: Evaluator can only see applicants in OPEN rounds
    if (userRole === 'EVALUATOR' && applicant.round.status !== RoundStatus.OPEN) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบผู้สมัครในรอบทุนที่เปิดรับประเมิน',
      });
    }

    const baseData = {
      id: applicant.id,
      roundId: applicant.roundId,
      importBatchId: applicant.importBatchId,
      legacySeq: applicant.legacySeq,
      studentCode: applicant.studentCode,
      titlePrefix: applicant.titlePrefix,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      faculty: applicant.faculty,
      major: applicant.major,
      studyYear: applicant.studyYear,
      gpa: Number(applicant.gpa),
      createdAt: applicant.createdAt,
    };

    // Evaluator: Returns education data + supporting info + map URL (NO citizenId, phone, email) (BR-APP-04)
    if (userRole === 'EVALUATOR') {
      return {
        ...baseData,
        supportingInfo: applicant.supportingInfo,
      };
    }

    // Admin: View-only education fields + legacySeq (NO citizenId, phone, email, supporting info) (BR-APP-02)
    return baseData;
  }

  async getImportHistory(roundId: number) {
    const batches = await this.prisma.importBatch.findMany({
      where: { roundId },
      orderBy: { importedAt: 'desc' },
      include: {
        importedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return batches;
  }
}
