import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hidden test admin account
  const hashedPassword = await bcrypt.hash('MXKtL*c55T', 12);
  await prisma.user.upsert({
    where: { email: 'abacus-0363aae2@example.com' },
    update: {},
    create: {
      email: 'abacus-0363aae2@example.com',
      password: hashedPassword,
      name: 'Admin Sistema',
      role: 'admin',
      isActive: true,
    },
  });

  // Seed system settings defaults
  const defaults = [
    { key: 'default_ac', value: '4.00' },
    { key: 'default_seguros', value: '0.20' },
    { key: 'default_riscos', value: '1.50' },
    { key: 'default_despesas_financeiras', value: '0.90' },
    { key: 'default_lucro', value: '7.50' },
    { key: 'default_pis', value: '0.65' },
    { key: 'default_cofins', value: '3.00' },
    { key: 'default_iss', value: '3.00' },
  ];

  for (const s of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
