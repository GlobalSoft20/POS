import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@shms.rw' },
    update: {},
    create: { name: 'Admin', email: 'admin@shms.rw', password, role: 'ADMIN' as any, pin: '1234' },
  });

  const categories = [
    { name: 'Beers', icon: '🍺', color: '#F59E0B' },
    { name: 'Soft Drinks', icon: '🥤', color: '#10B981' },
    { name: 'Cocktails', icon: '🍹', color: '#8B5CF6' },
    { name: 'Food', icon: '🍽️', color: '#EF4444' },
    { name: 'Wines', icon: '🍷', color: '#DC2626' },
    { name: 'Spirits', icon: '🥃', color: '#D97706' },
    { name: 'Snacks', icon: '🍿', color: '#6366F1' },
    { name: 'Rooms', icon: '🛏️', color: '#0EA5E9' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: cat,
    });
  }

  const tables = Array.from({ length: 10 }, (_, i) => ({
    number: `T${i + 1}`,
    name: `Table ${i + 1}`,
    capacity: 4,
    section: i < 5 ? 'Indoor' : 'Outdoor',
  }));

  for (const table of tables) {
    await prisma.table.upsert({
      where: { id: table.number },
      update: {},
      create: table,
    });
  }

  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Smart Hospitality',
      currency: 'RWF',
      vatRate: 18,
      receiptFooter: 'Thank you for your visit!',
    },
  });

  console.log('Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
