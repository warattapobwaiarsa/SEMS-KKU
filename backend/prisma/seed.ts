import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Users only)...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kku.ac.th' },
    update: {
      name: 'ผู้ดูแลระบบ ทุนการศึกษา (Admin)',
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@kku.ac.th',
      name: 'ผู้ดูแลระบบ ทุนการศึกษา (Admin)',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const evaluator1 = await prisma.user.upsert({
    where: { email: 'evaluator1@kku.ac.th' },
    update: {
      name: 'ศ.ดร. สุรชัย ใจมั่น (กรรมการประเมินทุน 1)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
    create: {
      email: 'evaluator1@kku.ac.th',
      name: 'ศ.ดร. สุรชัย ใจมั่น (กรรมการประเมินทุน 1)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  const evaluator2 = await prisma.user.upsert({
    where: { email: 'evaluator2@kku.ac.th' },
    update: {
      name: 'ผศ.ดร. วิภาดา เกียรติสกุล (กรรมการประเมินทุน 2)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
    create: {
      email: 'evaluator2@kku.ac.th',
      name: 'ผศ.ดร. วิภาดา เกียรติสกุล (กรรมการประเมินทุน 2)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  const evaluator3 = await prisma.user.upsert({
    where: { email: 'evaluator3@kku.ac.th' },
    update: {
      name: 'รศ.ดร. นพดล เจริญพร (กรรมการประเมินทุน 3)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
    create: {
      email: 'evaluator3@kku.ac.th',
      name: 'รศ.ดร. นพดล เจริญพร (กรรมการประเมินทุน 3)',
      role: UserRole.EVALUATOR,
      isActive: true,
    },
  });

  console.log('✅ Users ready:', {
    admin: admin.email,
    evaluator1: evaluator1.email,
    evaluator2: evaluator2.email,
    evaluator3: evaluator3.email,
  });

  console.log('🎉 Seeding completed! Database is clean and ready for custom setup.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
