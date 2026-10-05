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
  });

  console.log('✅ Sample round created:', round.name);
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
