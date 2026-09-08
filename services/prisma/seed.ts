import { PrismaClient, UserRole, AuthProvider, ProductPriceType, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Load menu.json
  const menuPath = path.join(__dirname, '../src/data/menu.json');
  if (!fs.existsSync(menuPath)) {
    console.error('❌ menu.json not found at:', menuPath);
    process.exit(1);
  }

  const rawMenu = fs.readFileSync(menuPath, 'utf-8');
  const menuData = JSON.parse(rawMenu);

  console.log(`📋 Found ${menuData.categories.length} categories and ${menuData.products.length} products in menu.json`);

  // 2. Seed Categories
  const categoryMap = new Map<string, string>(); // category name -> category id

  for (const cat of menuData.categories) {
    const slug = slugify(cat.name);
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        slug,
        description: cat.nepaliName,
        sortOrder: cat.menuPage || 0,
      },
      create: {
        name: cat.name,
        slug,
        description: cat.nepaliName,
        sortOrder: cat.menuPage || 0,
      },
    });

    categoryMap.set(cat.name, category.id);
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // 3. Seed Products & Variants (Optimized Batch)
  console.log('📦 Seeding products and variants...');
  let seededCount = 0;

  for (const prod of menuData.products) {
    const categoryId = categoryMap.get(prod.category);
    if (!categoryId) {
      console.warn(`  ⚠️ Category "${prod.category}" not found for product "${prod.name}"`);
      continue;
    }

    const slug = prod.id || slugify(prod.name);

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        categoryId,
        name: prod.name,
        description: prod.nepaliName || '',
        image: prod.image || '/images/food/default.jpg',
        priceType: ProductPriceType.VARIANT,
        isAvailable: prod.isAvailable ?? true,
      },
      create: {
        categoryId,
        name: prod.name,
        slug,
        description: prod.nepaliName || '',
        image: prod.image || '/images/food/default.jpg',
        priceType: ProductPriceType.VARIANT,
        isAvailable: prod.isAvailable ?? true,
      },
    });

    await prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });

    const variantData = Array.isArray(prod.variants) && prod.variants.length > 0
      ? prod.variants.map((v: any) => ({
          productId: product.id,
          name: v.name,
          price: v.price,
          isAvailable: true,
        }))
      : [{
          productId: product.id,
          name: 'Regular',
          price: prod.basePrice || 0,
          isAvailable: true,
        }];

    await prisma.productVariant.createMany({
      data: variantData,
    });

    seededCount++;
    if (seededCount % 15 === 0 || seededCount === menuData.products.length) {
      console.log(`  ✓ Seeded ${seededCount}/${menuData.products.length} products`);
    }
  }

  // 4. Seed Restaurant Tables (1 to 15)
  console.log('🪑 Seeding restaurant tables (1-15)...');
  for (let i = 1; i <= 15; i++) {
    const tableNum = `T-${i.toString().padStart(2, '0')}`;
    await prisma.restaurantTable.upsert({
      where: { tableNumber: tableNum },
      update: {},
      create: {
        tableNumber: tableNum,
        capacity: i <= 5 ? 2 : i <= 12 ? 4 : 8,
        status: TableStatus.AVAILABLE,
      },
    });
  }
  console.log('  ✓ 15 tables created/verified');

  // 5. Seed Admin Account
  console.log('👤 Seeding default admin user...');
  const adminEmail = 'admin@golukhajaghar.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('goleadmin', salt);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Gole Admin',
        phone: '9800000000',
        role: UserRole.ADMIN,
        authProvider: AuthProvider.LOCAL,
        passwordHash,
      },
    });

    await prisma.staffProfile.create({
      data: {
        userId: adminUser.id,
        employeeCode: 'ADM-001',
        isActive: true,
      },
    });

    console.log(`  ✓ Admin user created (${adminEmail} / password: goleadmin)`);
  } else {
    console.log(`  ✓ Admin user already exists (${adminEmail})`);
  }

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
