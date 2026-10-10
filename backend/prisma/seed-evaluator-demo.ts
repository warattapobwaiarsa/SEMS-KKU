/**
 * DEV ONLY demo data for testing the Evaluator pages
 * ข้อมูลจำลองสำหรับทดสอบหน้าผู้ประเมิน (Evaluator) เท่านั้น
 * ALL DATA IS FAKE [BR-PDP-11] - ห้ามใช้ข้อมูลจริงของผู้สมัคร
 * ไม่ควรรันใน production
 *
 * ต้องการ: seed หลัก (users) รันแล้วก่อน — จะหา users ผ่าน email
 * คำสั่งรัน: npx ts-node prisma/seed-evaluator-demo.ts
 *
 * DESIGN RULES:
 * - NO fixed ids (ใช้ autoincrement ของ Postgres) เพื่อไม่ให้ชน sequence เมื่อ Admin UI สร้างรอบ/เกณฑ์ใหม่
 * - หาข้อมูลเดิมด้วย natural keys: criteria name, round name, studentCode ภายใน round
 * - รันซ้ำได้ (idempotent): รันครั้งที่ 2 จะไม่สร้างอะไรใหม่
 * - ใช้ crypto util จริงเข้ารหัส citizenId (fake 13-digit ที่ผ่าน checksum)
 */

import { PrismaClient, UserRole, SubCriteriaType, RoundStatus } from '@prisma/client';
import { encryptCitizenId, maskCitizenId, validateThaiCitizenId } from '../src/common/crypto.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Evaluator demo data seeding...');

  // 1) ต้องมี users จาก seed หลักก่อน
  const admin = await prisma.user.findUnique({ where: { email: 'admin@kku.ac.th' } });
  const evaluator1 = await prisma.user.findUnique({ where: { email: 'evaluator1@kku.ac.th' } });
  const evaluator2 = await prisma.user.findUnique({ where: { email: 'evaluator2@kku.ac.th' } });

  if (!admin || !evaluator1 || !evaluator2) {
    console.error('❌ หา user หลักไม่เจอ — กรุณารัน seed หลัก (npx prisma db seed) ก่อน');
    process.exit(1);
  }

  console.log('✅ Users found:', {
    admin: admin.email,
    evaluator1: evaluator1.email,
    evaluator2: evaluator2.email,
  });

  // 2) Criteria: หาด้วย name (unique) — ถ้ามีแล้วใช้ตัวเดิม
  const criteria = await prisma.criteria.upsert({
    where: { name: 'เกณฑ์การประเมินทุนขาดแคลนทุนทรัพย์ ประจำปีการศึกษา 2569' },
    update: {},
    create: {
      name: 'เกณฑ์การประเมินทุนขาดแคลนทุนทรัพย์ ประจำปีการศึกษา 2569',
      subCriteria: {
        create: [
          {
            title: 'สถานะทางครอบครัวและรายได้ครัวเรือน',
            type: SubCriteriaType.SCORED,
            maxScore: 40,
            sortOrder: 1,
            allowComment: false,
          },
          {
            title: 'ผลการเรียนและความประพฤติ',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 2,
            allowComment: false,
          },
          {
            title: 'ความมุ่งมั่นและเหตุผลความจำเป็นในการขอรับทุน',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 3,
            allowComment: false,
          },
        ],
      },
    },
    include: { subCriteria: true },
  });

  console.log('✅ Criteria ready:', criteria.name, `(id=${criteria.id}, ${criteria.subCriteria.length} sub-criteria)`);

  // 3) Rounds: หาด้วย name (index) — ไม่มี unique constraint แต่จะหาด้วย name + academicYear + semester
  const roundDraft = await upsertRoundByName({
    name: 'ทุนการศึกษาสำหรับนักศึกษาขาดแคลนทุนทรัพย์อย่างแท้จริง ภาคต้น 2569',
    academicYear: 2569,
    semester: 1,
    criteriaId: criteria.id,
    status: RoundStatus.DRAFT,
  });

  const roundOpen = await upsertRoundByName({
    name: 'ทุนทดสอบข้อมูลจำลอง รอบเปิดประเมิน ภาคต้น 2569',
    academicYear: 2569,
    semester: 1,
    criteriaId: criteria.id,
    status: RoundStatus.OPEN,
    openedAt: new Date('2026-10-01T08:00:00.000+07:00'),
  });

  const roundClosed = await upsertRoundByName({
    name: 'ทุนทดสอบข้อมูลจำลอง รอบปิดแล้ว ภาคปลาย 2568',
    academicYear: 2568,
    semester: 2,
    criteriaId: criteria.id,
    status: RoundStatus.CLOSED,
    openedAt: new Date('2026-06-01T08:00:00.000+07:00'),
    closedAt: new Date('2026-08-31T17:00:00.000+07:00'),
  });

  // 4) ImportBatch: หาด้วย roundId + fileName
  const draftImportBatch = await upsertImportBatch({
    roundId: roundDraft.id,
    fileName: 'sample-draft-round.xlsx',
    totalRows: 1,
    validRows: 1,
    invalidRows: 0,
    importedById: admin.id,
  });

  const openImportBatch = await upsertImportBatch({
    roundId: roundOpen.id,
    fileName: 'sample-open-round.xlsx',
    totalRows: 5,
    validRows: 5,
    invalidRows: 0,
    importedById: admin.id,
  });

  const closedImportBatch = await upsertImportBatch({
    roundId: roundClosed.id,
    fileName: 'sample-closed-round.xlsx',
    totalRows: 2,
    validRows: 2,
    invalidRows: 0,
    importedById: admin.id,
  });

  // 5) Sample applicants data
  // ใช้ mock citizen ID prefix 14101000000 ที่ผ่าน validateThaiCitizenId ใน non-production
  const fakeCitizenIds = [
    '1410100000001',
    '1410100000002',
    '1410100000003',
    '1410100000004',
    '1410100000005',
    '1410100000006',
    '1410100000007',
    '1410100000008',
  ];

  // ตรวจสอบว่า mock IDs ผ่าน validation
  for (const cid of fakeCitizenIds) {
    if (!validateThaiCitizenId(cid)) {
      throw new Error(`Mock citizen ID ${cid} ไม่ผ่าน validation`);
    }
  }

  // เข้ารหัสล่วงหน้าด้วย crypto util จริง
  const encryptedCitizenIds = fakeCitizenIds.map((cid) => encryptCitizenId(cid));
  const maskedCitizenIds = fakeCitizenIds.map((cid) => maskCitizenId(cid));

  const sampleApplicants: ApplicantSeedData[] = [
    // OPEN round - 5 applicants
    {
      roundId: roundOpen.id,
      importBatchId: openImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-OPEN-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมคอมพิวเตอร์',
      studyYear: 4,
      gpa: 3.75,
      phone: '080-000-0001',
      email: 'fake01@example.com',
      citizenIdEncrypted: encryptedCitizenIds[0],
      citizenIdMasked: maskedCitizenIds[0],
      supportingInfo: {
        applicationDate: '1/5/2569',
        accommodation: 'หอพักจำลอง',
        rent: '3500',
        personalExpense: '2000',
        fatherOccupation: 'เกษตรกร (ข้อมูลเทียม)',
        fatherIncome: '12000',
        motherOccupation: 'แม่บ้าน (ข้อมูลเทียม)',
        motherIncome: '8000',
        tuitionPayer: 'บิดา (ข้อมูลเทียม)',
        accommodationMapUrl: 'https://maps.example.com/fake-location',
      },
    },
    {
      roundId: roundOpen.id,
      importBatchId: openImportBatch.id,
      legacySeq: 2,
      studentCode: 'FAKE-OPEN-02',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล02',
      faculty: 'คณะวิทยาศาสตร์',
      major: 'ชีววิทยา',
      studyYear: 3,
      gpa: 3.2,
      phone: '080-000-0002',
      email: 'fake02@example.com',
      citizenIdEncrypted: encryptedCitizenIds[1],
      citizenIdMasked: maskedCitizenIds[1],
      supportingInfo: {
        applicationDate: '2/5/2569',
        accommodation: 'บ้านพักจำลอง',
        personalExpense: '1500',
        guardianRelation: 'ป้า (ข้อมูลเทียม)',
        guardianIncome: '15000',
      },
    },
    {
      roundId: roundOpen.id,
      importBatchId: openImportBatch.id,
      legacySeq: 3,
      studentCode: 'FAKE-OPEN-03',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล03',
      faculty: 'คณะบัญชี',
      major: 'การบัญชี',
      studyYear: 2,
      gpa: 2.85,
      phone: '080-000-0003',
      email: 'fake03@example.com',
      citizenIdEncrypted: encryptedCitizenIds[2],
      citizenIdMasked: maskedCitizenIds[2],
      supportingInfo: {
        applicationDate: '3/5/2569',
        sideIncome: 'พาร์ทไทม์จำลอง 3000',
        siblingsStudying: '1 คน (ข้อมูลเทียม)',
        previousScholarships: 'ไม่เคยได้รับ (ข้อมูลเทียม)',
      },
    },
    {
      roundId: roundOpen.id,
      importBatchId: openImportBatch.id,
      legacySeq: 4,
      studentCode: 'FAKE-OPEN-04',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล04',
      faculty: 'คณะเศรษฐศาสตร์',
      major: 'เศรษฐศาสตร์',
      studyYear: 1,
      gpa: 2.5,
      phone: '080-000-0004',
      email: 'fake04@example.com',
      citizenIdEncrypted: encryptedCitizenIds[3],
      citizenIdMasked: maskedCitizenIds[3],
      // supportingInfo ว่างทั้งหมด — ทดสอบการแสดง "-" [FR-APP-04]
      supportingInfo: {},
    },
    {
      roundId: roundOpen.id,
      importBatchId: openImportBatch.id,
      legacySeq: 5,
      studentCode: 'FAKE-OPEN-05',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล05',
      faculty: 'คณะศึกษาศาสตร์',
      major: 'การศึกษาปฐมวัย',
      studyYear: 4,
      gpa: 3.9,
      phone: '080-000-0005',
      email: 'fake05@example.com',
      citizenIdEncrypted: encryptedCitizenIds[4],
      citizenIdMasked: maskedCitizenIds[4],
      supportingInfo: {
        applicationDate: '5/5/2569',
        studyEquipmentCost: '10000',
        electronicDevices: 'แล็ปท็อปจำลอง',
        parentsStatus: 'ครบสมบูรณ์ (ข้อมูลเทียม)',
        siblingsWorking: '1 คน (ข้อมูลเทียม)',
      },
    },
    // CLOSED round - 2 applicants
    {
      roundId: roundClosed.id,
      importBatchId: closedImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-CLOSE-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมปิด01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมโยธา',
      studyYear: 3,
      gpa: 3.4,
      phone: '080-000-0006',
      email: 'fake06@example.com',
      citizenIdEncrypted: encryptedCitizenIds[5],
      citizenIdMasked: maskedCitizenIds[5],
      supportingInfo: {
        applicationDate: '10/02/2568',
        accommodation: 'หอพักจำลอง (รอบปิด)',
        fatherIncome: '10000 (ข้อมูลเทียม)',
      },
    },
    {
      roundId: roundClosed.id,
      importBatchId: closedImportBatch.id,
      legacySeq: 2,
      studentCode: 'FAKE-CLOSE-02',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมปิด02',
      faculty: 'คณะเกษตรศาสตร์',
      major: 'พืชศาสตร์',
      studyYear: 2,
      gpa: 2.95,
      phone: '080-000-0007',
      email: 'fake07@example.com',
      citizenIdEncrypted: encryptedCitizenIds[6],
      citizenIdMasked: maskedCitizenIds[6],
      supportingInfo: {
        applicationDate: '11/02/2568',
        tuitionPayer: 'มารดา (ข้อมูลเทียม)',
      },
    },
    // DRAFT round - 1 applicant (existing round from main seed)
    {
      roundId: roundDraft.id,
      importBatchId: draftImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-DRAFT-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมร่าง01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมอุตสาหการ',
      studyYear: 4,
      gpa: 3.6,
      phone: '080-000-0008',
      email: 'fake08@example.com',
      citizenIdEncrypted: encryptedCitizenIds[7],
      citizenIdMasked: maskedCitizenIds[7],
      supportingInfo: {
        applicationDate: '1/5/2569',
        rent: '2800 (ข้อมูลเทียม)',
      },
    },
  ];

  // 6) Upsert applicants + supportingInfo + contact
  for (const sample of sampleApplicants) {
    const createdApplicant = await prisma.applicant.upsert({
      where: {
        roundId_studentCode: {
          roundId: sample.roundId,
          studentCode: sample.studentCode,
        },
      },
      update: {},
      create: {
        roundId: sample.roundId,
        importBatchId: sample.importBatchId,
        legacySeq: sample.legacySeq,
        studentCode: sample.studentCode,
        titlePrefix: sample.titlePrefix,
        firstName: sample.firstName,
        lastName: sample.lastName,
        faculty: sample.faculty,
        major: sample.major,
        studyYear: sample.studyYear,
        gpa: sample.gpa,
      },
    });

    // Supporting info (upsert by applicantId)
    await prisma.applicantSupportingInfo.upsert({
      where: { applicantId: createdApplicant.id },
      update: {},
      create: {
        applicantId: createdApplicant.id,
        ...sample.supportingInfo,
      },
    });

    // Contact (upsert by applicantId) — ใช้ citizenIdEncrypted จริงจาก crypto util
    await prisma.applicantContact.upsert({
      where: { applicantId: createdApplicant.id },
      update: {},
      create: {
        applicantId: createdApplicant.id,
        phone: sample.phone,
        email: sample.email,
        citizenIdEncrypted: sample.citizenIdEncrypted,
        citizenIdMasked: sample.citizenIdMasked,
      },
    });
  }

  // 7) Print summary of created/found IDs
  const allRounds = await prisma.scholarshipRound.findMany({
    where: { name: { contains: 'ทุนทดสอบ' } },
    select: { id: true, name: true, status: true },
  });
  const allApplicants = await prisma.applicant.findMany({
    where: { studentCode: { startsWith: 'FAKE-' } },
    select: { id: true, studentCode: true, roundId: true },
  });

  console.log('\n📋 Summary of demo data:');
  console.log('Rounds:');
  for (const r of allRounds) {
    console.log(`  - id=${r.id} ${r.name} (${r.status})`);
  }
  console.log('Applicants:');
  for (const a of allApplicants) {
    console.log(`  - id=${a.id} ${a.studentCode} (roundId=${a.roundId})`);
  }
  console.log(`\n✅ Evaluator demo data ready! Total ${allApplicants.length} applicants across ${allRounds.length} rounds.`);
  console.log('💡 รันซ้ำได้: รันครั้งที่ 2 จะไม่สร้างข้อมูลใหม่ (idempotent)');
}

// Helper types
interface ApplicantSeedData {
  roundId: number;
  importBatchId: number;
  legacySeq: number;
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
  citizenIdEncrypted: string;
  citizenIdMasked: string;
  supportingInfo: Record<string, unknown>;
}

async function upsertRoundByName(data: {
  name: string;
  academicYear: number;
  semester: number;
  criteriaId: number;
  status: RoundStatus;
  openedAt?: Date;
  closedAt?: Date;
}) {
  const existing = await prisma.scholarshipRound.findFirst({
    where: {
      name: data.name,
      academicYear: data.academicYear,
      semester: data.semester,
    },
  });

  if (existing) {
    // Update status/dates if provided (ในกรณีมีการเปลี่ยนแปลง)
    return prisma.scholarshipRound.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        ...(data.openedAt ? { openedAt: data.openedAt } : {}),
        ...(data.closedAt ? { closedAt: data.closedAt } : {}),
      },
    });
  }

  return prisma.scholarshipRound.create({
    data: {
      name: data.name,
      academicYear: data.academicYear,
      semester: data.semester,
      criteriaId: data.criteriaId,
      status: data.status,
      openedAt: data.openedAt,
      closedAt: data.closedAt,
    },
  });
}

async function upsertImportBatch(data: {
  roundId: number;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedById: number;
}) {
  const existing = await prisma.importBatch.findFirst({
    where: { roundId: data.roundId, fileName: data.fileName },
  });

  if (existing) {
    return existing;
  }

  return prisma.importBatch.create({
    data: {
      roundId: data.roundId,
      fileName: data.fileName,
      totalRows: data.totalRows,
      validRows: data.validRows,
      invalidRows: data.invalidRows,
      importedById: data.importedById,
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Evaluator demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });