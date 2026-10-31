import {
  PrismaClient,
  UserRole,
  RoundStatus,
  SubCriteriaType,
} from '@prisma/client';
import {
  encryptCitizenId,
  maskCitizenId,
} from '../src/common/crypto.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 1. Cleaning existing database tables...');

  // ล้างข้อมูลตารางตามลำดับ Foreign Key Dependency
  await prisma.evaluationItem.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.applicantContact.deleteMany();
  await prisma.applicantSupportingInfo.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.allocationSummary.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.scholarshipRound.deleteMany();
  await prisma.subCriteria.deleteMany();
  await prisma.criteria.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 2. Seeding Users (Admin & Evaluators)...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@kku.ac.th',
      name: 'ผู้ดูแลระบบ ทุนการศึกษา (Admin)',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const evaluator1 = await prisma.user.create({
    data: {
      email: 'evaluator1@kku.ac.th',
      name: 'ศ.ดร. สุรชัย ใจมั่น (กรรมการประเมินทุน 1)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  const evaluator2 = await prisma.user.create({
    data: {
      email: 'evaluator2@kku.ac.th',
      name: 'ผศ.ดร. วิภาดา เกียรติสกุล (กรรมการประเมินทุน 2)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  const evaluator3 = await prisma.user.create({
    data: {
      email: 'evaluator3@kku.ac.th',
      name: 'รศ.ดร. นพดล เจริญพร (กรรมการประเมินทุน 3)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  console.log('📋 3. Seeding Criteria (ชุดเกณฑ์การประเมิน ผลรวม 100 คะแนน)...');

  const criteria = await prisma.criteria.create({
    data: {
      name: 'เกณฑ์การประเมินทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์ คณะวิศวกรรมศาสตร์ มข.',
      subCriteria: {
        create: [
          {
            title: '1. สถานะทางครอบครัวและรายได้รวมของครัวเรือน',
            type: SubCriteriaType.SCORED,
            maxScore: 40,
            sortOrder: 1,
            allowComment: false,
          },
          {
            title: '2. ผลการเรียน ความประพฤติ และการมีส่วนร่วมในกิจกรรม',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 2,
            allowComment: false,
          },
          {
            title: '3. ความจำเป็นเร่งด่วนและภาระค่าใช้จ่ายเกี่ยวกับการศึกษา',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
            sortOrder: 3,
            allowComment: false,
          },
          {
            title: '4. ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมของคณะกรรมการ',
            type: SubCriteriaType.TEXT,
            maxScore: null,
            sortOrder: 4,
            allowComment: true,
          },
        ],
      },
    },
  });

  console.log('🎓 4. Seeding Scholarship Round (รอบทุนสถานะ OPEN)...');

  const round = await prisma.scholarshipRound.create({
    data: {
      name: 'ทุนการศึกษาช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์ ประจำปีการศึกษา 2569',
      academicYear: 2569,
      semester: 1,
      status: RoundStatus.OPEN,
      openedAt: new Date(),
      criteriaId: criteria.id,
    },
  });

  console.log('📦 5. Seeding Import Batch & Applicants (พิกัดสถานที่จริงในจังหวัดขอนแก่น)...');

  const batch = await prisma.importBatch.create({
    data: {
      roundId: round.id,
      fileName: 'import-data-sample-khon-kaen.xlsx',
      totalRows: 5,
      validRows: 5,
      invalidRows: 0,
      importedById: admin.id,
    },
  });

  // ข้อมูลผู้สมัครพร้อมสถานที่จริงในจังหวัดขอนแก่น
  const applicantsData = [
    {
      legacySeq: 1,
      studentCode: '663040001-2',
      titlePrefix: 'นาย',
      firstName: 'อัครเดช',
      lastName: 'รัตนศิลป์',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมคอมพิวเตอร์',
      studyYear: 2,
      gpa: 3.25,
      phone: '0812345671',
      email: 'akkaradech.r@kkumail.com',
      citizenId: '1409900123451',
      supporting: {
        applicationDate: '15/01/2569 09:30',
        accommodation: 'หอพักที่ 26 มหาวิทยาลัยขอนแก่น (หอพักใน มข.)',
        rent: '950 บาท/เดือน (รวมค่าน้ำ-ไฟ)',
        personalExpense: '4,500 บาท/เดือน',
        studyEquipmentCost: '1,500 บาท/ภาคการศึกษา',
        electronicDevices: 'โน้ตบุ๊กและโทรศัพท์มือถือ',
        sideIncome: 'รับจ้างทำแล็บคอมพิวเตอร์ 1,200 บาท/เดือน',
        fatherAge: '52',
        fatherOccupation: 'เกษตรกร (ทำไร่อ้อย)',
        fatherIncome: '8,000 บาท/เดือน',
        fatherStatus: 'มีชีวิตอยู่',
        motherAge: '49',
        motherOccupation: 'รับจ้างทั่วไป',
        motherIncome: '6,500 บาท/เดือน',
        motherStatus: 'มีชีวิตอยู่',
        parentsStatus: 'อยู่ด้วยกัน',
        tuitionPayer: 'บิดา-มารดา',
        guardianRelation: 'บิดา',
        guardianOccupation: 'เกษตรกร',
        guardianIncome: '8,000 บาท/เดือน',
        siblingsWorking: '1',
        siblingsNotWorking: '0',
        siblingsStudying: '1',
        studentLoan: 'กู้ยืม กยศ. ค่าเล่าเรียนและค่าครองชีพ',
        previousScholarships: 'ไม่เคยได้รับทุนการศึกษา',
        accommodationMapUrl: 'https://www.google.com/maps?q=16.478950,102.825630',
      },
    },
    {
      legacySeq: 2,
      studentCode: '653040015-8',
      titlePrefix: 'นางสาว',
      firstName: 'พัชราภา',
      lastName: 'วงศ์สว่าง',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมโยธา',
      studyYear: 3,
      gpa: 2.85,
      phone: '0812345672',
      email: 'patcharapha.w@kkumail.com',
      citizenId: '1409900123460',
      supporting: {
        applicationDate: '16/01/2569 10:15',
        accommodation: 'หอพักพิมานคอนโดปาร์ค กังสดาล มข. ต.ในเมือง อ.เมือง จ.ขอนแก่น',
        rent: '3,500 บาท/เดือน',
        personalExpense: '5,000 บาท/เดือน',
        studyEquipmentCost: '2,000 บาท/ภาคการศึกษา',
        electronicDevices: 'ไอแพดและโทรศัพท์มือถือ',
        sideIncome: 'ไม่มีรายได้เสริม',
        fatherAge: '56',
        fatherOccupation: 'ค้าขายรายย่อย',
        fatherIncome: '9,000 บาท/เดือน',
        fatherStatus: 'มีชีวิตอยู่',
        motherAge: '53',
        motherOccupation: 'แม่บ้าน',
        motherIncome: '0',
        motherStatus: 'มีชีวิตอยู่',
        parentsStatus: 'อยู่ด้วยกัน',
        tuitionPayer: 'บิดา',
        guardianRelation: 'บิดา',
        guardianOccupation: 'ค้าขายรายย่อย',
        guardianIncome: '9,000 บาท/เดือน',
        siblingsWorking: '0',
        siblingsNotWorking: '0',
        siblingsStudying: '2',
        studentLoan: 'กู้ยืม กยศ.',
        previousScholarships: 'ทุนผู้มีผลการเรียนดี คณะวิศวกรรมศาสตร์ ปี 2567 : 5,000 บาท',
        accommodationMapUrl: 'https://www.google.com/maps?q=16.463200,102.828100',
      },
    },
    {
      legacySeq: 3,
      studentCode: '673040120-4',
      titlePrefix: 'นาย',
      firstName: 'ณัฐภัทร',
      lastName: 'วัฒนากูล',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมเคมี',
      studyYear: 1,
      gpa: 3.40,
      phone: '0812345673',
      email: 'nattapat.w@kkumail.com',
      citizenId: '1409900123478',
      supporting: {
        applicationDate: '16/01/2569 13:40',
        accommodation: 'หอพักศุภกฤต อพาร์ตเมนต์ หลังมอ ซอยวัดป่าโนนม่วง อ.เมือง จ.ขอนแก่น',
        rent: '2,800 บาท/เดือน',
        personalExpense: '4,800 บาท/เดือน',
        studyEquipmentCost: '1,800 บาท/ภาคการศึกษา',
        electronicDevices: 'แล็ปท็อปและสมาร์ตโฟน',
        sideIncome: 'พนักงานร้านกาแฟพาร์ทไทม์ 2,000 บาท/เดือน',
        fatherAge: '50',
        fatherOccupation: 'รับจ้างขับรถส่งของ',
        fatherIncome: '11,000 บาท/เดือน',
        fatherStatus: 'มีชีวิตอยู่',
        motherAge: '48',
        motherOccupation: 'พนักงานบริการ',
        motherIncome: '8,500 บาท/เดือน',
        motherStatus: 'มีชีวิตอยู่',
        parentsStatus: 'หย่าร้าง',
        tuitionPayer: 'มารดา',
        guardianRelation: 'มารดา',
        guardianOccupation: 'พนักงานบริการ',
        guardianIncome: '8,500 บาท/เดือน',
        siblingsWorking: '0',
        siblingsNotWorking: '1',
        siblingsStudying: '1',
        studentLoan: 'ไม่ได้กู้ยืม',
        previousScholarships: 'ไม่เคยได้รับทุนการศึกษา',
        accommodationMapUrl: 'https://www.google.com/maps?q=16.485120,102.816400',
      },
    },
    {
      legacySeq: 4,
      studentCode: '643040210-9',
      titlePrefix: 'นางสาว',
      firstName: 'เบญจมาศ',
      lastName: 'ทองสุข',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมอุตสาหการ',
      studyYear: 4,
      gpa: 3.12,
      phone: '0812345674',
      email: 'benjamas.t@kkumail.com',
      citizenId: '1409900123486',
      supporting: {
        applicationDate: '17/01/2569 11:20',
        accommodation: 'หอพักเจริญสุข ริมบึงหนองแวงตราชู กังสดาล ต.ในเมือง อ.เมือง จ.ขอนแก่น',
        rent: '3,200 บาท/เดือน',
        personalExpense: '5,200 บาท/เดือน',
        studyEquipmentCost: '1,200 บาท/ภาคการศึกษา',
        electronicDevices: 'คอมพิวเตอร์และโทรศัพท์มือถือ',
        sideIncome: 'สอนพิเศษคณิตศาสตร์ 3,000 บาท/เดือน',
        fatherAge: '58',
        fatherOccupation: 'ข้าราชการบำนาญ',
        fatherIncome: '14,000 บาท/เดือน',
        fatherStatus: 'มีชีวิตอยู่',
        motherAge: '55',
        motherOccupation: 'ค้าขาย',
        motherIncome: '9,000 บาท/เดือน',
        motherStatus: 'มีชีวิตอยู่',
        parentsStatus: 'อยู่ด้วยกัน',
        tuitionPayer: 'บิดา-มารดา',
        guardianRelation: 'บิดา',
        guardianOccupation: 'ข้าราชการบำนาญ',
        guardianIncome: '14,000 บาท/เดือน',
        siblingsWorking: '1',
        siblingsNotWorking: '0',
        siblingsStudying: '0',
        studentLoan: 'กู้ยืม กยศ.',
        previousScholarships: 'ทุนช่วยเหลือนักศึกษาขาดแคลน ปี 2566 : 10,000 บาท',
        accommodationMapUrl: 'https://www.google.com/maps?q=16.459500,102.831200',
      },
    },
    {
      legacySeq: 5,
      studentCode: '663040332-1',
      titlePrefix: 'นาย',
      firstName: 'ธนกฤต',
      lastName: 'ศรีบุญเรือง',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมไฟฟ้า',
      studyYear: 2,
      gpa: 2.95,
      phone: '0812345675',
      email: 'thanakrit.s@kkumail.com',
      citizenId: '1409900123494',
      supporting: {
        applicationDate: '18/01/2569 14:05',
        accommodation: 'บ้านพักอาศัยส่วนตัว บ้านเลขที่ 124 หมู่ 3 ต.ศิลา อ.เมือง จ.ขอนแก่น',
        rent: '0 (บ้านพักตนเอง)',
        personalExpense: '4,000 บาท/เดือน',
        studyEquipmentCost: '1,000 บาท/ภาคการศึกษา',
        electronicDevices: 'โน้ตบุ๊ก',
        sideIncome: 'ไม่มีรายได้เสริม',
        fatherAge: '54',
        fatherOccupation: 'ทำสวนและเกษตรกรรม',
        fatherIncome: '7,500 บาท/เดือน',
        fatherStatus: 'มีชีวิตอยู่',
        motherAge: '51',
        motherOccupation: 'แม่บ้าน',
        motherIncome: '0',
        motherStatus: 'มีชีวิตอยู่',
        parentsStatus: 'อยู่ด้วยกัน',
        tuitionPayer: 'บิดา',
        guardianRelation: 'บิดา',
        guardianOccupation: 'เกษตรกรรม',
        guardianIncome: '7,500 บาท/เดือน',
        siblingsWorking: '0',
        siblingsNotWorking: '0',
        siblingsStudying: '2',
        studentLoan: 'กู้ยืม กยศ.',
        previousScholarships: 'ไม่เคยได้รับทุนการศึกษา',
        accommodationMapUrl: 'https://www.google.com/maps?q=16.498100,102.842500',
      },
    },
  ];

  for (const item of applicantsData) {
    const applicant = await prisma.applicant.create({
      data: {
        roundId: round.id,
        importBatchId: batch.id,
        legacySeq: item.legacySeq,
        studentCode: item.studentCode,
        titlePrefix: item.titlePrefix,
        firstName: item.firstName,
        lastName: item.lastName,
        faculty: item.faculty,
        major: item.major,
        studyYear: item.studyYear,
        gpa: item.gpa,
        contact: {
          create: {
            phone: item.phone,
            email: item.email,
            citizenIdEncrypted: encryptCitizenId(item.citizenId),
            citizenIdMasked: maskCitizenId(item.citizenId),
          },
        },
        supportingInfo: {
          create: item.supporting,
        },
      },
    });

    console.log(`  👤 สร้างผู้สมัคร: ${applicant.studentCode} ${applicant.firstName} (${item.supporting.accommodation})`);
  }

  console.log('🎉 Seeding and database reset completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
