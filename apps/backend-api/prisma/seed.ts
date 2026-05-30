import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const saPassword = await bcrypt.hash('superadmin123', 10);

  await prisma.superAdmin.upsert({
    where: { email: 'superadmin@shms.rw' },
    update: {},
    create: { name: 'Super Admin', email: 'superadmin@shms.rw', password: saPassword },
  });

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', trialDays: 14, starterPrice: 29000, professionalPrice: 79000, enterprisePrice: 199000 },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shms.rw' },
    update: {},
    create: { name: 'Admin', email: 'admin@shms.rw', password, role: 'ADMIN', pin: '1234' },
  });

  const business = await prisma.business.upsert({
    where: { email: 'demo@shms.rw' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      email: 'demo@shms.rw',
      phone: '+250788000000',
      country: 'Rwanda',
      status: 'ACTIVE',
      isVerified: true,
      ownerId: adminUser.id,
    },
  });

  await prisma.subscription.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      amount: 79000,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
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
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) await prisma.category.create({ data: cat });
  }

  for (let i = 1; i <= 10; i++) {
    const name = `Table ${i}`;
    const existing = await prisma.table.findFirst({ where: { number: `T${i}` } });
    if (!existing) {
      await prisma.table.create({
        data: { number: `T${i}`, name, capacity: 4, section: i <= 5 ? 'Indoor' : 'Outdoor' },
      });
    }
  }

  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', name: 'Smart Hospitality', currency: 'RWF', vatRate: 18, receiptFooter: 'Thank you for your visit!' },
  });

  console.log('✅ Seed completed');
  console.log('   Super Admin: superadmin@shms.rw / superadmin123');
  console.log('   Admin:       admin@shms.rw / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
