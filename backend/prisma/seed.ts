import {
  PrismaClient,
  UserRole,
  SubCriteriaType,
  RoundStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kku.ac.th' },
    update: {},
    create: {
      email: 'admin@kku.ac.th',
      name: 'ผู้ดูแลระบบ ทุนการศึกษา (Admin)',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const evaluator1 = await prisma.user.upsert({
    where: { email: 'evaluator1@kku.ac.th' },
    update: {},
    create: {
      email: 'evaluator1@kku.ac.th',
      name: 'ศ.ดร. กรรมการ ประเมินทุน 1',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  const evaluator2 = await prisma.user.upsert({
    where: { email: 'evaluator2@kku.ac.th' },
    update: {},
    create: {
      email: 'evaluator2@kku.ac.th',
      name: 'ผศ.ดร. กรรมการ ประเมินทุน 2',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  console.log('✅ Users created:', {
    admin: admin.email,
    evaluator1: evaluator1.email,
    evaluator2: evaluator2.email,
  });

  const criteria = await prisma.criteria.upsert({
    where: { id: 1 },
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
          },
          {
            title: 'ผลการเรียนและความประพฤติ',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 2,
          },
          {
            title: 'ความมุ่งมั่นและเหตุผลความจำเป็นในการขอรับทุน',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Criteria created (Total 100 points):', criteria.name);

  const round = await prisma.scholarshipRound.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'ทุนการศึกษาสำหรับนักศึกษาขาดแคลนทุนทรัพย์อย่างแท้จริง ภาคต้น 2569',
      academicYear: 2569,
      semester: 1,
      criteriaId: criteria.id,
      status: RoundStatus.DRAFT,
    },
  });  console.log('✅ Sample round created:', round.name);

  // =============================================================================
  // [Step 3] ข้อมูลจำลองสำหรับทดสอบ API ผู้ประเมิน — เพิ่มอย่างเดียว (ADDITIVE)
  //  - ข้อมูลเทียมทั้งหมดตาม BR-PDP-11 (ห้ามใช้ข้อมูลจริงของผู้สมัคร)
  //  - รันซ้ำได้ (idempotent): ทุกคำสั่งเป็น upsert กับ id คงที่ / ค่า unique
  //  - ไม่สร้าง Evaluation / EvaluationItem เลย เพื่อให้ test เริ่มจากยังไม่มีผลประเมิน
  //  - ยังไม่มี encryption helper ในโปรเจกต์นี้ (ค้นแล้วไม่พบ)
  //    จึงเก็บ citizenIdEncrypted เป็นค่า placeholder ของปลอมไปก่อน
  // =============================================================================

  // --- 1) รอบทุนสถานะ OPEN (ใช้เกณฑ์เดิมด้านบน) ทดสอบ FR-EVL-01/BR-EVL-01 ---
  const openRound = await prisma.scholarshipRound.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2, // ระบุ id ตรงๆ ให้รันซ้ำแล้วชนแถวเดิม ไม่สร้างซ้ำ
      name: 'ทุนทดสอบข้อมูลจำลอง รอบเปิดประเมิน ภาคต้น 2569',
      academicYear: 2569,
      semester: 1,
      criteriaId: criteria.id,
      status: RoundStatus.OPEN,
      openedAt: new Date('2026-10-01T08:00:00.000+07:00'),
    },
  });

  // --- 2) รอบทุนสถานะ CLOSED (ไว้ทดสอบว่าผู้สมัครของรอบไม่ใช่ OPEN ถูกซ่อน) ---
  const closedRound = await prisma.scholarshipRound.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'ทุนทดสอบข้อมูลจำลอง รอบปิดแล้ว ภาคปลาย 2568',
      academicYear: 2568,
      semester: 2,
      criteriaId: criteria.id,
      status: RoundStatus.CLOSED,
      openedAt: new Date('2026-06-01T08:00:00.000+07:00'),
      closedAt: new Date('2026-08-31T17:00:00.000+07:00'),
    },
  });

  // --- 3) ImportBatch 1 แถวต่อ 1 รอบ (ผู้สมัครบังคับมี importBatchId) ---
  const draftImportBatch = await prisma.importBatch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      roundId: round.id,
      fileName: 'sample-draft-round.xlsx',
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      importedById: admin.id,
    },
  });

  const openImportBatch = await prisma.importBatch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      roundId: openRound.id,
      fileName: 'sample-open-round.xlsx',
      totalRows: 5,
      validRows: 5,
      invalidRows: 0,
      importedById: admin.id,
    },
  });

  const closedImportBatch = await prisma.importBatch.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      roundId: closedRound.id,
      fileName: 'sample-closed-round.xlsx',
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      importedById: admin.id,
    },
  });

  // --- 4) ค่า placeholder ของ citizenIdEncrypted ---
  // ยังไม่มี module เข้ารหัสจริงในโปรเจกต์ (ยืนยันแล้วจากการค้นหา)
  // จึงใส่ค่าที่ "เห็นชัดว่าเป็นของปลอม" แทน ciphertext จริงตาม NFR-SEC-02 (ชั่วคราว)
  const FAKE_CITIZEN_ID_PLACEHOLDER =
    'FAKE-PLACEHOLDER-NOT-ENCRYPTED-0000000000000';

  // --- 5) ผู้สมัครตัวอย่าง 8 คน (OPEN 5, CLOSED 2, DRAFT 1) ---
  // ตั้งชื่อ/รหัสให้ดูเป็นข้อมูลเทียมชัดเจน, คณะ/ปีการศึกษา/GPA หลากหลาย
  // supportingInfo: {} (ของ FAKE-OPEN-04) = ข้อมูลประกอบว่างทั้งหมด ไว้ทดสอบการแสดง "-" [FR-APP-04]
  const sampleApplicants = [
    {
      roundId: openRound.id,
      importBatchId: openImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-OPEN-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมคอมพิวเตอร์',
      studyYear: 4,
      gpa: '3.75',
      phone: '080-000-0001',
      email: 'fake01@example.com',
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
      roundId: openRound.id,
      importBatchId: openImportBatch.id,
      legacySeq: 2,
      studentCode: 'FAKE-OPEN-02',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล02',
      faculty: 'คณะวิทยาศาสตร์',
      major: 'ชีววิทยา',
      studyYear: 3,
      gpa: '3.20',
      phone: '080-000-0002',
      email: 'fake02@example.com',
      supportingInfo: {
        applicationDate: '2/5/2569',
        accommodation: 'บ้านพักจำลอง',
        personalExpense: '1500',
        guardianRelation: 'ป้า (ข้อมูลเทียม)',
        guardianIncome: '15000',
      },
    },
    {
      roundId: openRound.id,
      importBatchId: openImportBatch.id,
      legacySeq: 3,
      studentCode: 'FAKE-OPEN-03',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล03',
      faculty: 'คณะบัญชี',
      major: 'การบัญชี',
      studyYear: 2,
      gpa: '2.85',
      phone: '080-000-0003',
      email: 'fake03@example.com',
      supportingInfo: {
        applicationDate: '3/5/2569',
        sideIncome: 'พาร์ทไทม์จำลอง 3000',
        siblingsStudying: '1 คน (ข้อมูลเทียม)',
        previousScholarships: 'ไม่เคยได้รับ (ข้อมูลเทียม)',
      },
    },
    {
      roundId: openRound.id,
      importBatchId: openImportBatch.id,
      legacySeq: 4,
      studentCode: 'FAKE-OPEN-04',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล04',
      faculty: 'คณะเศรษฐศาสตร์',
      major: 'เศรษฐศาสตร์',
      studyYear: 1,
      gpa: '2.50',
      phone: '080-000-0004',
      email: 'fake04@example.com',
      // จงใจเว้นว่างทั้งหมด เพื่อทดสอบการแสดงป้ายหัวข้อ + "-" [FR-APP-04]
      supportingInfo: {},
    },
    {
      roundId: openRound.id,
      importBatchId: openImportBatch.id,
      legacySeq: 5,
      studentCode: 'FAKE-OPEN-05',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมกุล05',
      faculty: 'คณะศึกษาศาสตร์',
      major: 'การศึกษาปฐมวัย',
      studyYear: 4,
      gpa: '3.90',
      phone: '080-000-0005',
      email: 'fake05@example.com',
      supportingInfo: {
        applicationDate: '5/5/2569',
        studyEquipmentCost: '10000',
        electronicDevices: 'แล็ปท็อปจำลอง',
        parentsStatus: 'ครบสมบูรณ์ (ข้อมูลเทียม)',
        siblingsWorking: '1 คน (ข้อมูลเทียม)',
      },
    },
    {
      roundId: closedRound.id,
      importBatchId: closedImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-CLOSE-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมปิด01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมโยธา',
      studyYear: 3,
      gpa: '3.40',
      phone: '080-000-0006',
      email: 'fake06@example.com',
      supportingInfo: {
        applicationDate: '10/02/2568',
        accommodation: 'หอพักจำลอง (รอบปิด)',
        fatherIncome: '10000 (ข้อมูลเทียม)',
      },
    },
    {
      roundId: closedRound.id,
      importBatchId: closedImportBatch.id,
      legacySeq: 2,
      studentCode: 'FAKE-CLOSE-02',
      titlePrefix: 'นางสาว',
      firstName: 'ทดสอบ',
      lastName: 'เทียมปิด02',
      faculty: 'คณะเกษตรศาสตร์',
      major: 'พืชศาสตร์',
      studyYear: 2,
      gpa: '2.95',
      phone: '080-000-0007',
      email: 'fake07@example.com',
      supportingInfo: {
        applicationDate: '11/02/2568',
        tuitionPayer: 'มารดา (ข้อมูลเทียม)',
      },
    },
    {
      roundId: round.id, // ผู้สมัคร 1 คนของรอบ DRAFT เดิม (ทดสอบฝั่ง Admin ได้)
      importBatchId: draftImportBatch.id,
      legacySeq: 1,
      studentCode: 'FAKE-DRAFT-01',
      titlePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'เทียมร่าง01',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมอุตสาหการ',
      studyYear: 4,
      gpa: '3.60',
      phone: '080-000-0008',
      email: 'fake08@example.com',
      supportingInfo: {
        applicationDate: '1/5/2569',
        rent: '2800 (ข้อมูลเทียม)',
      },
    },
  ];

  for (const sample of sampleApplicants) {
    // upsert ด้วยค่า unique (roundId, studentCode) — รันซ้ำได้ไม่สร้างซ้ำ
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

    // ข้อมูลประกอบ — ถ้า supportingInfo เป็น {} จะสร้างแถบที่ทุกช่องว่าง (ค่า null)
    await prisma.applicantSupportingInfo.upsert({
      where: { applicantId: createdApplicant.id },
      update: {},
      create: {
        applicantId: createdApplicant.id,
        ...sample.supportingInfo,
      },
    });

    // ข้อมูลติดต่อ — citizenIdEncrypted ใช้ placeholder ของปลอม (ยังไม่มี encryption helper)
    await prisma.applicantContact.upsert({
      where: { applicantId: createdApplicant.id },
      update: {},
      create: {
        applicantId: createdApplicant.id,
        phone: sample.phone,
        email: sample.email,
        citizenIdEncrypted: FAKE_CITIZEN_ID_PLACEHOLDER,
        // รูปแบบ mask ตาม BR-PDP-03 โดยใช้ตัวเลขปลอมชัดเจน
        citizenIdMasked: '9-9999-XXXXX-XX-9',
      },
    });
  }

  console.log('✅ Sample OPEN round created:', openRound.name);
  console.log('✅ Sample CLOSED round created:', closedRound.name);
  console.log('✅ Sample applicants created:', sampleApplicants.length, 'people');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
