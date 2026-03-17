import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'Owner', description: 'Pemilik merchant' },
    { name: 'Kasir', description: 'Petugas kasir POS' },
    { name: 'Gudang', description: 'Petugas inventaris dan stok' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('Seed roles berhasil');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });