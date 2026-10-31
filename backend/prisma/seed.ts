import { PrismaClient, UserRole } from '@prisma/client';

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

  const evaluator3 = await prisma.user.upsert({
    where: { email: 'evaluator3@kku.ac.th' },
    update: {},
    create: {
      email: 'evaluator3@kku.ac.th',
      name: 'รศ.ดร. กรรมการ ประเมินทุน 3',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  console.log('✅ Users created:', {
    admin: admin.email,
    evaluator1: evaluator1.email,
    evaluator2: evaluator2.email,
    evaluator3: evaluator3.email,
  });

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
