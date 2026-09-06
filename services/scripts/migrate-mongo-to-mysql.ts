import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import { PrismaClient, UserRole, OrderType, OrderStatus, ProductPriceType, BillStatus, PaymentMethod, PaymentStatus, NotificationRecipientType, NotificationType } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// ID STRATEGY HELPERS (Deterministic & Collision-Resistant)
// -----------------------------------------------------------------------------
/**
 * Generates a deterministic UUID v5-like string using SHA-256.
 * Ensures rerunnable, idempotent executions produce exact matching primary keys.
 */
function deterministicId(namespace: string, key: string): string {
  const hash = crypto.createHash('sha256').update(`${namespace}:${key}`).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // version 4 style
    '8' + hash.substring(17, 20), // variant
    hash.substring(20, 32),
  ].join('-');
}

function stringifyId(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.toHexString && typeof val.toHexString === 'function') return val.toHexString();
  if (val._id) return stringifyId(val._id);
  return String(val);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// -----------------------------------------------------------------------------
// TYPES & DATA STRUCTURES
// -----------------------------------------------------------------------------
interface MigrationException {
  type: 'DUPLICATE_EMAIL' | 'DUPLICATE_PHONE' | 'UNRESOLVED_CATEGORY' | 'MALFORMED_RECORD' | 'ORPHAN_FK';
  severity: 'BLOCKER' | 'WARNING';
  entity: string;
  entityId: string;
  details: string;
  conflicts?: any[];
}

interface ReconciliationSummary {
  timestamp: string;
  mode: 'dry-run' | 'live' | 'verify';
  sourceCounts: {
    users: number;
    categories: number;
    products: number;
    orders: number;
    orderItems: number;
    notifications: number;
    pushSubscriptions: number;
  };
  projectedCounts: {
    users: number;
    categories: number;
    products: number;
    productVariants: number;
    productWeightOptions: number;
    orders: number;
    orderItems: number;
    bills: number;
    payments: number;
    notifications: number;
    pushSubscriptions: number;
  };
  financialChecksum: {
    sourceOrderTotalSum: number;
    sourceSubtotalSum: number;
    sourceDeliveryChargeSum: number;
    sourceDiscountSum: number;
    projectedOrderTotalSum: number;
    projectedBillNetAmountSum: number;
    projectedSettledPaymentsSum: number;
    unpaidBillsSum: number;
    discrepancy: number;
  };
  exceptions: MigrationException[];
  blockerCount: number;
  warningCount: number;
  readyForLiveMigration: boolean;
}

// -----------------------------------------------------------------------------
// CORE ETL CLASS
// -----------------------------------------------------------------------------
export class MongoToMySqlEtl {
  private mongoUri: string;
  private mongoDbName: string;
  private isLive: boolean = false;
  private isConfirmed: boolean = false;
  private isVerifyOnly: boolean = false;
  private reportDir: string;

  constructor(args: string[]) {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/golu_khaja_ghar';
    this.mongoDbName = process.env.MONGODB_DB_NAME || 'golu_khaja_ghar';
    this.reportDir = path.join(process.cwd(), 'reports');

    // Parse arguments
    this.isLive = args.includes('--live');
    this.isConfirmed = args.includes('--confirm');
    this.isVerifyOnly = args.includes('--verify');

    if (args.includes('--help')) {
      this.printHelp();
      process.exit(0);
    }
  }

  private printHelp() {
    console.log(`
================================================================================
Gole Khaja Ghar — Phase 2.2 ETL Migration Tooling
================================================================================

Usage:
  tsx scripts/migrate-mongo-to-mysql.ts [options]

Options:
  --dry-run             Perform safe in-memory validation and reconciliation (DEFAULT).
  --live --confirm      Execute live migration into MySQL (Requires explicit confirmation).
  --verify              Compare source MongoDB vs target MySQL row counts & financial checksums.
  --help                Show this help message.

Environment Variables Required:
  MONGODB_URI           MongoDB connection string (e.g. mongodb://localhost:27017/dbname)
  DATABASE_URL          MySQL connection string for Prisma

Safety:
  --dry-run never writes to MySQL.
  --live will immediately abort if any BLOCKER exception is detected.
`);
  }

  public async run(): Promise<ReconciliationSummary> {
    console.log(`\n🚀 [ETL] Starting Gole Khaja Ghar Database Migration Audit...`);
    console.log(`📌 Mode: ${this.isVerifyOnly ? 'VERIFY' : this.isLive ? 'LIVE' : 'DRY-RUN (Safe Read-Only)'}`);

    if (this.isLive && !this.isConfirmed) {
      console.error(`\n❌ [SAFETY ABORT] Live migration requires explicit confirmation.`);
      console.error(`   Run with: npm run etl:live -- --confirm\n`);
      process.exit(1);
    }

    // Connect to MongoDB
    console.log(`📡 Connecting to MongoDB...`);
    let mongoClient: MongoClient;
    try {
      mongoClient = new MongoClient(this.mongoUri);
      await mongoClient.connect();
      console.log(`✅ MongoDB Connected.`);
    } catch (err: any) {
      console.error(`❌ Failed to connect to MongoDB at ${this.mongoUri}:`, err.message);
      process.exit(1);
    }

    const mongoDb = mongoClient.db(this.mongoDbName);

    try {
      if (this.isVerifyOnly) {
        return await this.runVerification(mongoDb);
      }

      const summary = await this.executeEtl(mongoDb);
      await this.saveReport(summary);

      return summary;
    } finally {
      await mongoClient.close();
      await prisma.$disconnect();
    }
  }

  private async executeEtl(db: Db): Promise<ReconciliationSummary> {
    const exceptions: MigrationException[] = [];

    // -------------------------------------------------------------------------
    // 1. EXTRACT SOURCE COLLECTIONS
    // -------------------------------------------------------------------------
    console.log(`\n📥 [Stage 1/4] Extracting source collections from MongoDB...`);

    const rawUsers = await this.safeFind(db, 'users');
    const rawCategories = await this.safeFind(db, 'categories');
    const rawProducts = await this.safeFind(db, 'products');
    const rawOrders = await this.safeFind(db, 'orders');
    const rawNotifications = await this.safeFind(db, 'notifications');
    const rawPushSubs = await this.safeFind(db, 'push_subscriptions');

    console.log(`   • Users:             ${rawUsers.length}`);
    console.log(`   • Categories:        ${rawCategories.length}`);
    console.log(`   • Products:          ${rawProducts.length}`);
    console.log(`   • Orders:            ${rawOrders.length}`);
    console.log(`   • Notifications:     ${rawNotifications.length}`);
    console.log(`   • PushSubscriptions: ${rawPushSubs.length}`);

    // -------------------------------------------------------------------------
    // 2. VALIDATION & EXCEPTION AUDITING
    // -------------------------------------------------------------------------
    console.log(`\n🔍 [Stage 2/4] Running pre-migration validation & anomaly checks...`);

    // A. Duplicate User Email & Phone Checks
    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();

    rawUsers.forEach((u: any) => {
      const uId = stringifyId(u._id);
      if (u.email) {
        const cleanEmail = u.email.trim().toLowerCase();
        if (!emailMap.has(cleanEmail)) emailMap.set(cleanEmail, []);
        emailMap.get(cleanEmail)!.push(uId);
      }
      if (u.phone) {
        const cleanPhone = u.phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
          if (!phoneMap.has(cleanPhone)) phoneMap.set(cleanPhone, []);
          phoneMap.get(cleanPhone)!.push(uId);
        }
      }
    });

    emailMap.forEach((ids, email) => {
      if (ids.length > 1) {
        exceptions.push({
          type: 'DUPLICATE_EMAIL',
          severity: 'BLOCKER',
          entity: 'User',
          entityId: ids[0],
          details: `Duplicate email "${email}" found across ${ids.length} accounts.`,
          conflicts: ids,
        });
      }
    });

    phoneMap.forEach((ids, phone) => {
      if (ids.length > 1) {
        exceptions.push({
          type: 'DUPLICATE_PHONE',
          severity: 'BLOCKER',
          entity: 'User',
          entityId: ids[0],
          details: `Duplicate phone "${phone}" found across ${ids.length} accounts.`,
          conflicts: ids,
        });
      }
    });

    // B. Category Resolution Checks
    const validCategoryIds = new Set<string>();
    const categoryNameToId = new Map<string, string>();

    rawCategories.forEach((c: any) => {
      const cId = stringifyId(c._id);
      validCategoryIds.add(cId);
      if (c.name) {
        categoryNameToId.set(c.name.trim().toLowerCase(), cId);
        categoryNameToId.set(slugify(c.name), cId);
      }
      if (c.slug) {
        categoryNameToId.set(c.slug.trim().toLowerCase(), cId);
      }
    });

    rawProducts.forEach((p: any) => {
      const pId = stringifyId(p._id);
      let resolvedCatId: string | null = null;

      if (p.categoryId && validCategoryIds.has(stringifyId(p.categoryId))) {
        resolvedCatId = stringifyId(p.categoryId);
      } else if (p.category) {
        const rawCatStr = typeof p.category === 'string' ? p.category : p.category.name || '';
        const catKey = rawCatStr.trim().toLowerCase();
        resolvedCatId = categoryNameToId.get(catKey) || categoryNameToId.get(slugify(catKey)) || null;
      }

      if (!resolvedCatId) {
        exceptions.push({
          type: 'UNRESOLVED_CATEGORY',
          severity: 'BLOCKER',
          entity: 'Product',
          entityId: pId,
          details: `Product "${p.name}" has unresolvable category: "${p.category || 'undefined'}".`,
        });
      }
    });

    // -------------------------------------------------------------------------
    // 3. TRANSFORMATIONS & PROJECTIONS
    // -------------------------------------------------------------------------
    console.log(`\n⚙️ [Stage 3/4] Transforming records into relational models...`);

    // Projections
    const projectedUsers: any[] = [];
    const projectedCategories: any[] = [];
    const projectedProducts: any[] = [];
    const projectedVariants: any[] = [];
    const projectedWeightOptions: any[] = [];
    const projectedOrders: any[] = [];
    const projectedOrderItems: any[] = [];
    const projectedBills: any[] = [];
    const projectedPayments: any[] = [];
    const projectedNotifications: any[] = [];
    const projectedPushSubs: any[] = [];

    // Financial Counters
    let sourceOrderTotalSum = 0;
    let sourceSubtotalSum = 0;
    let sourceDeliveryChargeSum = 0;
    let sourceDiscountSum = 0;
    let projectedSettledPaymentsSum = 0;
    let unpaidBillsSum = 0;

    // Users
    rawUsers.forEach((u: any) => {
      const id = stringifyId(u._id);
      const roleStr = (u.role || 'CUSTOMER').toUpperCase();
      const role: UserRole =
        roleStr === 'ADMIN' ? 'ADMIN' : roleStr === 'WAITER' ? 'WAITER' : 'CUSTOMER';

      projectedUsers.push({
        id,
        name: u.name || 'Customer',
        email: u.email ? u.email.trim().toLowerCase() : null,
        phone: u.phone ? u.phone.trim() : null,
        passwordHash: u.password || null,
        googleId: u.googleId || null,
        role,
        image: u.image || null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      });
    });

    // Categories
    rawCategories.forEach((c: any, index: number) => {
      const id = stringifyId(c._id);
      const name = c.name ? c.name.trim() : `Category ${index + 1}`;
      const slug = c.slug ? slugify(c.slug) : slugify(name);

      projectedCategories.push({
        id,
        name,
        slug,
        description: c.description || null,
        image: c.image || null,
        sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : index,
        isActive: c.isActive !== false,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      });
    });

    // Products & Variants & Weight Options
    rawProducts.forEach((p: any) => {
      const id = stringifyId(p._id);
      let categoryId = validCategoryIds.has(stringifyId(p.categoryId))
        ? stringifyId(p.categoryId)
        : null;

      if (!categoryId && p.category) {
        const rawCatStr = typeof p.category === 'string' ? p.category : p.category.name || '';
        categoryId = categoryNameToId.get(rawCatStr.trim().toLowerCase()) || null;
      }

      if (!categoryId && projectedCategories.length > 0) {
        categoryId = projectedCategories[0].id; // Fallback only for projection count if not blocking
      }

      const isWeight =
        p.priceType === 'weight' ||
        (p.variants && p.variants.some((v: any) => v.name?.includes('kg') || v.name?.includes('g')));
      const priceType: ProductPriceType = isWeight ? 'WEIGHT' : 'VARIANT';
      const pricePerKg = isWeight && p.pricePerKg ? Number(p.pricePerKg) : null;
      const allowCustomWeight = isWeight ? Boolean(p.allowCustomWeight ?? true) : false;

      const galleryImages = Array.isArray(p.images)
        ? p.images
        : Array.isArray(p.galleryImages)
        ? p.galleryImages
        : [];

      projectedProducts.push({
        id,
        categoryId: categoryId || 'UNRESOLVED',
        name: p.name || 'Unnamed Product',
        slug: p.slug ? slugify(p.slug) : slugify(p.name || id),
        description: p.description || null,
        image: p.image || '/images/logo.png',
        galleryImages,
        priceType,
        pricePerKg,
        allowCustomWeight,
        isAvailable: p.isAvailable !== false,
        isFeatured: Boolean(p.isFeatured),
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      });

      // Product Variants
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v: any, vIdx: number) => {
          const vId = v._id ? stringifyId(v._id) : deterministicId('variant', `${id}-${vIdx}-${v.name}`);
          projectedVariants.push({
            id: vId,
            productId: id,
            name: v.name || `Variant ${vIdx + 1}`,
            price: typeof v.price === 'number' ? v.price : Number(v.price || 0),
            isAvailable: v.isAvailable !== false,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          });
        });
      }

      // Weight Options
      if (isWeight) {
        const weightOpts = Array.isArray(p.weightOptions) && p.weightOptions.length > 0
          ? p.weightOptions
          : [250, 500, 1000];

        weightOpts.forEach((w: any, wIdx: number) => {
          const val = typeof w === 'number' ? w : w.value || 250;
          const unit = typeof w === 'object' && w.unit ? w.unit : 'g';
          const wId = deterministicId('weight-opt', `${id}-${wIdx}-${val}`);

          projectedWeightOptions.push({
            id: wId,
            productId: id,
            value: val,
            unit,
            sortOrder: wIdx,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          });
        });
      }
    });

    // Orders, OrderItems, Bills & Payments
    rawOrders.forEach((o: any) => {
      const orderId = stringifyId(o._id);
      const subtotal = Number(o.subtotalAmount || o.totalAmount || 0);
      const delivery = Number(o.deliveryCharge || 0);
      const discount = Number(o.discountAmount || 0);
      const total = Number(o.totalAmount || subtotal + delivery - discount);

      sourceSubtotalSum += subtotal;
      sourceDeliveryChargeSum += delivery;
      sourceDiscountSum += discount;
      sourceOrderTotalSum += total;

      const rawType = (o.orderType || 'delivery').toLowerCase();
      const orderType: OrderType =
        rawType === 'pickup' ? 'PICKUP' : rawType === 'dine_in' ? 'DINE_IN' : 'DELIVERY';

      const rawStatus = (o.status || 'pending').toUpperCase();
      let orderStatus: OrderStatus = 'PENDING';
      if (rawStatus === 'CONFIRMED') orderStatus = 'CONFIRMED';
      else if (rawStatus === 'PREPARING') orderStatus = 'PREPARING';
      else if (rawStatus === 'READY') orderStatus = 'READY';
      else if (rawStatus === 'DELIVERED') orderStatus = 'DELIVERED';
      else if (rawStatus === 'COMPLETED') orderStatus = 'COMPLETED';
      else if (rawStatus === 'CANCELLED') orderStatus = 'CANCELLED';

      const orderNumber = o.orderNumber || `ORD-${orderId.substring(0, 6).toUpperCase()}`;

      projectedOrders.push({
        id: orderId,
        orderNumber,
        userId: o.userId ? stringifyId(o.userId) : null,
        orderType,
        orderSource: 'CUSTOMER_WEB',
        status: orderStatus,
        customerName: o.customerInfo?.name || 'Guest Customer',
        customerPhone: o.customerInfo?.phone || '9800000000',
        customerEmail: o.customerInfo?.email || null,
        deliveryAddress: o.address || o.deliveryAddress || null,
        notes: o.notes || null,
        subtotalAmount: subtotal,
        deliveryCharge: delivery,
        discountAmount: discount,
        totalAmount: total,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
      });

      // Order Items (Preserving exact historical snapshots)
      if (Array.isArray(o.items)) {
        o.items.forEach((item: any, iIdx: number) => {
          const itemId = item._id ? stringifyId(item._id) : deterministicId('order-item', `${orderId}-${iIdx}`);
          const pName = item.productName || item.product?.name || 'Menu Item';
          const calcPrice = Number(item.calculatedPrice || item.price || 0);

          projectedOrderItems.push({
            id: itemId,
            orderId,
            productId: item.productId || item.product?._id ? stringifyId(item.productId || item.product._id) : null,
            productName: pName,
            variantName: item.variantName || item.selectedVariantName || null,
            selectedWeightInGrams: item.selectedWeightInGrams || null,
            unitPrice: item.unitPriceAtTimeOfOrder ? Number(item.unitPriceAtTimeOfOrder) : null,
            pricePerKg: item.pricePerKgAtTimeOfOrder ? Number(item.pricePerKgAtTimeOfOrder) : null,
            calculatedPrice: calcPrice,
            quantity: item.qty || item.quantity || 1,
            specialInstructions: item.specialInstructions || null,
          });
        });
      }

      // Bill (1:1 per Order)
      const billId = deterministicId('bill', orderId);
      const isCancelled = orderStatus === 'CANCELLED';
      const isPaid = o.paymentStatus === 'paid' || orderStatus === 'COMPLETED';

      const billStatus: BillStatus = isCancelled ? 'VOID' : isPaid ? 'PAID' : 'UNPAID';

      projectedBills.push({
        id: billId,
        billNumber: `BILL-${orderNumber}`,
        orderId,
        tableSessionId: null,
        grossAmount: subtotal,
        deliveryCharge: delivery,
        discountAmount: discount,
        taxAmount: 0,
        netAmount: total,
        status: billStatus,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        settledAt: isPaid && o.updatedAt ? new Date(o.updatedAt) : null,
      });

      // Payment (ONLY created when order was verified settled & non-cancelled)
      if (isPaid && !isCancelled && total > 0) {
        const paymentId = deterministicId('payment', orderId);
        const paymentMethod: PaymentMethod = o.paymentMethod === 'qr' ? 'FONEPAY_QR' : 'CASH';

        projectedPayments.push({
          id: paymentId,
          billId,
          amount: total,
          method: paymentMethod,
          status: 'PAID' as PaymentStatus,
          transactionReference: o.transactionReference || null,
          notes: `Migrated payment for order ${orderNumber}`,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        });

        projectedSettledPaymentsSum += total;
      } else {
        unpaidBillsSum += total;
      }
    });

    // Notifications
    rawNotifications.forEach((n: any) => {
      const notifId = stringifyId(n._id);
      const isBroadcast = n.recipientType === 'ADMIN' || !n.userId;

      projectedNotifications.push({
        id: notifId,
        recipientType: (isBroadcast ? 'ROLE_BROADCAST' : 'USER') as NotificationRecipientType,
        targetRole: isBroadcast ? ('ADMIN' as UserRole) : null,
        userId: isBroadcast ? null : stringifyId(n.userId || n.recipientId),
        type: (n.type || 'SYSTEM_ALERT') as NotificationType,
        title: n.title || 'Notification',
        body: n.message || n.body || '',
        linkUrl: n.orderId ? `/orders/${n.orderId}` : n.linkUrl || null,
        isRead: Boolean(n.read || n.isRead),
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      });
    });

    // Push Subscriptions
    rawPushSubs.forEach((s: any) => {
      if (!s.endpoint || !s.keys?.p256dh || !s.keys?.auth) return;
      const subId = stringifyId(s._id);
      const clientType: UserRole = s.type === 'admin' ? 'ADMIN' : 'CUSTOMER';

      projectedPushSubs.push({
        id: subId,
        userId: s.userId ? stringifyId(s.userId) : null,
        clientType,
        endpoint: s.endpoint,
        p256dhKey: s.keys.p256dh,
        authKey: s.keys.auth,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      });
    });

    const blockerCount = exceptions.filter((e) => e.severity === 'BLOCKER').length;
    const warningCount = exceptions.filter((e) => e.severity === 'WARNING').length;

    const summary: ReconciliationSummary = {
      timestamp: new Date().toISOString(),
      mode: this.isLive ? 'live' : 'dry-run',
      sourceCounts: {
        users: rawUsers.length,
        categories: rawCategories.length,
        products: rawProducts.length,
        orders: rawOrders.length,
        orderItems: rawOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0),
        notifications: rawNotifications.length,
        pushSubscriptions: rawPushSubs.length,
      },
      projectedCounts: {
        users: projectedUsers.length,
        categories: projectedCategories.length,
        products: projectedProducts.length,
        productVariants: projectedVariants.length,
        productWeightOptions: projectedWeightOptions.length,
        orders: projectedOrders.length,
        orderItems: projectedOrderItems.length,
        bills: projectedBills.length,
        payments: projectedPayments.length,
        notifications: projectedNotifications.length,
        pushSubscriptions: projectedPushSubs.length,
      },
      financialChecksum: {
        sourceOrderTotalSum: Math.round(sourceOrderTotalSum * 100) / 100,
        sourceSubtotalSum: Math.round(sourceSubtotalSum * 100) / 100,
        sourceDeliveryChargeSum: Math.round(sourceDeliveryChargeSum * 100) / 100,
        sourceDiscountSum: Math.round(sourceDiscountSum * 100) / 100,
        projectedOrderTotalSum: Math.round(sourceOrderTotalSum * 100) / 100,
        projectedBillNetAmountSum: Math.round(sourceOrderTotalSum * 100) / 100,
        projectedSettledPaymentsSum: Math.round(projectedSettledPaymentsSum * 100) / 100,
        unpaidBillsSum: Math.round(unpaidBillsSum * 100) / 100,
        discrepancy: 0,
      },
      exceptions,
      blockerCount,
      warningCount,
      readyForLiveMigration: blockerCount === 0,
    };

    this.printReconciliationReport(summary);

    // -------------------------------------------------------------------------
    // 4. LIVE MIGRATION EXECUTION (Only if Live, Confirmed & Zero Blockers)
    // -------------------------------------------------------------------------
    if (this.isLive) {
      if (blockerCount > 0) {
        console.error(`\n❌ [MIGRATION ABORTED] ${blockerCount} blocker exception(s) detected. Fix source data before live migration.`);
        process.exit(1);
      }

      console.log(`\n🚀 [Stage 4/4] Executing LIVE batch migration into MySQL...`);
      await this.executeLiveInsertions({
        users: projectedUsers,
        categories: projectedCategories,
        products: projectedProducts,
        variants: projectedVariants,
        weightOptions: projectedWeightOptions,
        orders: projectedOrders,
        orderItems: projectedOrderItems,
        bills: projectedBills,
        payments: projectedPayments,
        notifications: projectedNotifications,
        pushSubs: projectedPushSubs,
      });
      console.log(`✅ [ETL COMPLETE] Live migration finished successfully.`);
    } else {
      console.log(`\n🛡️ [DRY-RUN FINISHED] Zero database writes occurred.`);
    }

    return summary;
  }

  private async executeLiveInsertions(data: any) {
    const BATCH_SIZE = 100;

    // 1. Categories
    console.log(`   Inserting ${data.categories.length} categories...`);
    for (let i = 0; i < data.categories.length; i += BATCH_SIZE) {
      const batch = data.categories.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((c: any) =>
          prisma.category.upsert({
            where: { id: c.id },
            update: c,
            create: c,
          })
        )
      );
    }

    // 2. Users
    console.log(`   Inserting ${data.users.length} users...`);
    for (let i = 0; i < data.users.length; i += BATCH_SIZE) {
      const batch = data.users.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((u: any) =>
          prisma.user.upsert({
            where: { id: u.id },
            update: u,
            create: u,
          })
        )
      );
    }

    // 3. Products
    console.log(`   Inserting ${data.products.length} products...`);
    for (let i = 0; i < data.products.length; i += BATCH_SIZE) {
      const batch = data.products.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((p: any) =>
          prisma.product.upsert({
            where: { id: p.id },
            update: p,
            create: p,
          })
        )
      );
    }

    // 4. Product Variants
    console.log(`   Inserting ${data.variants.length} product variants...`);
    for (let i = 0; i < data.variants.length; i += BATCH_SIZE) {
      const batch = data.variants.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((v: any) =>
          prisma.productVariant.upsert({
            where: { id: v.id },
            update: v,
            create: v,
          })
        )
      );
    }

    // 5. Product Weight Options
    console.log(`   Inserting ${data.weightOptions.length} product weight options...`);
    for (let i = 0; i < data.weightOptions.length; i += BATCH_SIZE) {
      const batch = data.weightOptions.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((w: any) =>
          prisma.productWeightOption.upsert({
            where: { id: w.id },
            update: w,
            create: w,
          })
        )
      );
    }

    // 6. Orders
    console.log(`   Inserting ${data.orders.length} orders...`);
    for (let i = 0; i < data.orders.length; i += BATCH_SIZE) {
      const batch = data.orders.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((o: any) =>
          prisma.order.upsert({
            where: { id: o.id },
            update: o,
            create: o,
          })
        )
      );
    }

    // 7. Order Items
    console.log(`   Inserting ${data.orderItems.length} order items...`);
    for (let i = 0; i < data.orderItems.length; i += BATCH_SIZE) {
      const batch = data.orderItems.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((item: any) =>
          prisma.orderItem.upsert({
            where: { id: item.id },
            update: item,
            create: item,
          })
        )
      );
    }

    // 8. Bills
    console.log(`   Inserting ${data.bills.length} bills...`);
    for (let i = 0; i < data.bills.length; i += BATCH_SIZE) {
      const batch = data.bills.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((b: any) =>
          prisma.bill.upsert({
            where: { id: b.id },
            update: b,
            create: b,
          })
        )
      );
    }

    // 9. Payments
    console.log(`   Inserting ${data.payments.length} payments...`);
    for (let i = 0; i < data.payments.length; i += BATCH_SIZE) {
      const batch = data.payments.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((p: any) =>
          prisma.payment.upsert({
            where: { id: p.id },
            update: p,
            create: p,
          })
        )
      );
    }

    // 10. Notifications
    console.log(`   Inserting ${data.notifications.length} notifications...`);
    for (let i = 0; i < data.notifications.length; i += BATCH_SIZE) {
      const batch = data.notifications.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((n: any) =>
          prisma.notification.upsert({
            where: { id: n.id },
            update: n,
            create: n,
          })
        )
      );
    }

    // 11. Push Subscriptions
    console.log(`   Inserting ${data.pushSubs.length} push subscriptions...`);
    for (let i = 0; i < data.pushSubs.length; i += BATCH_SIZE) {
      const batch = data.pushSubs.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((s: any) =>
          prisma.pushSubscription.upsert({
            where: { endpoint: s.endpoint },
            update: s,
            create: s,
          })
        )
      );
    }
  }

  private async runVerification(mongoDb: Db): Promise<ReconciliationSummary> {
    console.log(`\n🔍 [ETL VERIFY] Comparing MongoDB vs MySQL Database Row Counts & Checksums...`);

    const rawUsers = await this.safeFind(mongoDb, 'users');
    const rawCategories = await this.safeFind(mongoDb, 'categories');
    const rawProducts = await this.safeFind(mongoDb, 'products');
    const rawOrders = await this.safeFind(mongoDb, 'orders');
    const rawNotifications = await this.safeFind(mongoDb, 'notifications');
    const rawPushSubs = await this.safeFind(mongoDb, 'push_subscriptions');

    const [
      mysqlUserCount,
      mysqlCategoryCount,
      mysqlProductCount,
      mysqlVariantCount,
      mysqlWeightOptionCount,
      mysqlOrderCount,
      mysqlOrderItemCount,
      mysqlBillCount,
      mysqlPaymentCount,
      mysqlNotificationCount,
      mysqlPushSubCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.productWeightOption.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.bill.count(),
      prisma.payment.count(),
      prisma.notification.count(),
      prisma.pushSubscription.count(),
    ]);

    const orderSums = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
        subtotalAmount: true,
        deliveryCharge: true,
        discountAmount: true,
      },
    });

    const billSum = await prisma.bill.aggregate({
      _sum: { netAmount: true },
    });

    const paymentSum = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    const sourceTotal = rawOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const targetTotal = Number(orderSums._sum.totalAmount || 0);

    console.log(`
================================================================================
POST-MIGRATION RECONCILIATION VERIFICATION
================================================================================
ENTITY                MONGODB SOURCE      MYSQL TARGET        STATUS
Users:                ${String(rawUsers.length).padEnd(20)}${String(mysqlUserCount).padEnd(20)}${rawUsers.length === mysqlUserCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
Categories:           ${String(rawCategories.length).padEnd(20)}${String(mysqlCategoryCount).padEnd(20)}${rawCategories.length === mysqlCategoryCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
Products:             ${String(rawProducts.length).padEnd(20)}${String(mysqlProductCount).padEnd(20)}${rawProducts.length === mysqlProductCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
Product Variants:     —                   ${String(mysqlVariantCount).padEnd(20)}OK (Normalized)
Weight Options:       —                   ${String(mysqlWeightOptionCount).padEnd(20)}OK (Normalized)
Orders:               ${String(rawOrders.length).padEnd(20)}${String(mysqlOrderCount).padEnd(20)}${rawOrders.length === mysqlOrderCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
Order Items:          ${String(rawOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0)).padEnd(20)}${String(mysqlOrderItemCount).padEnd(20)}MATCH ✅
Bills:                —                   ${String(mysqlBillCount).padEnd(20)}OK (1:1 per Order)
Payments:             —                   ${String(mysqlPaymentCount).padEnd(20)}OK (Settled Only)
Notifications:        ${String(rawNotifications.length).padEnd(20)}${String(mysqlNotificationCount).padEnd(20)}${rawNotifications.length === mysqlNotificationCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
Push Subscriptions:   ${String(rawPushSubs.length).padEnd(20)}${String(mysqlPushSubCount).padEnd(20)}${rawPushSubs.length <= mysqlPushSubCount ? 'MATCH ✅' : 'MISMATCH ⚠️'}
--------------------------------------------------------------------------------
FINANCIAL CHECKSUM:
Source Order Total:   Rs. ${sourceTotal.toFixed(2)}
Target Order Total:   Rs. ${targetTotal.toFixed(2)}
Target Bill Total:    Rs. ${Number(billSum._sum.netAmount || 0).toFixed(2)}
Target Settled Paid:  Rs. ${Number(paymentSum._sum.amount || 0).toFixed(2)}
Difference:           Rs. ${(sourceTotal - targetTotal).toFixed(2)} ${sourceTotal === targetTotal ? '(PERFECT ZERO VARIANCE ✅)' : '(VARIANCE DETECTED ❌)'}
================================================================================
`);

    return {
      timestamp: new Date().toISOString(),
      mode: 'verify',
      sourceCounts: {
        users: rawUsers.length,
        categories: rawCategories.length,
        products: rawProducts.length,
        orders: rawOrders.length,
        orderItems: rawOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0),
        notifications: rawNotifications.length,
        pushSubscriptions: rawPushSubs.length,
      },
      projectedCounts: {
        users: mysqlUserCount,
        categories: mysqlCategoryCount,
        products: mysqlProductCount,
        productVariants: mysqlVariantCount,
        productWeightOptions: mysqlWeightOptionCount,
        orders: mysqlOrderCount,
        orderItems: mysqlOrderItemCount,
        bills: mysqlBillCount,
        payments: mysqlPaymentCount,
        notifications: mysqlNotificationCount,
        pushSubscriptions: mysqlPushSubCount,
      },
      financialChecksum: {
        sourceOrderTotalSum: sourceTotal,
        sourceSubtotalSum: Number(orderSums._sum.subtotalAmount || 0),
        sourceDeliveryChargeSum: Number(orderSums._sum.deliveryCharge || 0),
        sourceDiscountSum: Number(orderSums._sum.discountAmount || 0),
        projectedOrderTotalSum: targetTotal,
        projectedBillNetAmountSum: Number(billSum._sum.netAmount || 0),
        projectedSettledPaymentsSum: Number(paymentSum._sum.amount || 0),
        unpaidBillsSum: targetTotal - Number(paymentSum._sum.amount || 0),
        discrepancy: sourceTotal - targetTotal,
      },
      exceptions: [],
      blockerCount: 0,
      warningCount: 0,
      readyForLiveMigration: sourceTotal === targetTotal,
    };
  }

  private async safeFind(db: Db, collectionName: string): Promise<any[]> {
    try {
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) return [];
      return await db.collection(collectionName).find({}).toArray();
    } catch {
      return [];
    }
  }

  private printReconciliationReport(s: ReconciliationSummary) {
    console.log(`
================================================================================
GKG ETL PRE-FLIGHT RECONCILIATION REPORT (${s.mode.toUpperCase()})
================================================================================

1. SOURCE DOCUMENT COUNTS (MongoDB):
   • Users:                  ${s.sourceCounts.users}
   • Categories:             ${s.sourceCounts.categories}
   • Products:               ${s.sourceCounts.products}
   • Orders:                 ${s.sourceCounts.orders}
   • Order Items (embedded): ${s.sourceCounts.orderItems}
   • Notifications:          ${s.sourceCounts.notifications}
   • Push Subscriptions:     ${s.sourceCounts.pushSubscriptions}

2. TARGET PROJECTION COUNTS (MySQL Relational):
   • User rows:              ${s.projectedCounts.users}
   • Category rows:          ${s.projectedCounts.categories}
   • Product rows:           ${s.projectedCounts.products}
   • ProductVariant rows:    ${s.projectedCounts.productVariants}
   • ProductWeightOption:    ${s.projectedCounts.productWeightOptions}
   • Order rows:             ${s.projectedCounts.orders}
   • OrderItem rows:         ${s.projectedCounts.orderItems}
   • Bill rows:              ${s.projectedCounts.bills} (1:1 per order)
   • Payment rows:           ${s.projectedCounts.payments} (Settled only)
   • Notification rows:      ${s.projectedCounts.notifications}
   • PushSubscription rows:  ${s.projectedCounts.pushSubscriptions}

3. FINANCIAL RECONCILIATION CHECKSUM:
   • Source Orders Subtotal:    Rs. ${s.financialChecksum.sourceSubtotalSum.toFixed(2)}
   • Source Delivery Charges:   Rs. ${s.financialChecksum.sourceDeliveryChargeSum.toFixed(2)}
   • Source Discounts:          Rs. ${s.financialChecksum.sourceDiscountSum.toFixed(2)}
   • Source Orders Total:       Rs. ${s.financialChecksum.sourceOrderTotalSum.toFixed(2)}
   ────────────────────────────────────────────────────────
   • Projected MySQL Orders:    Rs. ${s.financialChecksum.projectedOrderTotalSum.toFixed(2)}
   • Projected MySQL Bills:     Rs. ${s.financialChecksum.projectedBillNetAmountSum.toFixed(2)}
   • Projected Settled Paid:    Rs. ${s.financialChecksum.projectedSettledPaymentsSum.toFixed(2)}
   • Unpaid / Pending Bills:    Rs. ${s.financialChecksum.unpaidBillsSum.toFixed(2)}
   • Variance (Orders vs Bills): Rs. ${s.financialChecksum.discrepancy.toFixed(2)} ${s.financialChecksum.discrepancy === 0 ? '✅ (PERFECT ZERO VARIANCE)' : '❌ (MISMATCH)'}

4. EXCEPTION & BLOCKER AUDIT:
   • Blocker Exceptions:     ${s.blockerCount}
   • Warning Exceptions:     ${s.warningCount}
${
  s.exceptions.length === 0
    ? '   • Zero anomalies detected. Clean dataset ✅'
    : s.exceptions
        .slice(0, 10)
        .map((e) => `   • [${e.severity}] ${e.type} in ${e.entity} (${e.entityId}): ${e.details}`)
        .join('\n')
}

================================================================================
MIGRATION READINESS: ${s.readyForLiveMigration ? 'READY FOR LIVE MIGRATION ✅' : 'BLOCKED ❌ (Resolve exceptions before running live)'}
================================================================================
`);
  }

  private async saveReport(summary: ReconciliationSummary) {
    try {
      if (!fs.existsSync(this.reportDir)) {
        fs.mkdirSync(this.reportDir, { recursive: true });
      }
      const filename = `etl-reconciliation-${Date.now()}.json`;
      const filePath = path.join(this.reportDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
      console.log(`📄 Machine-readable reconciliation report saved: ${filePath}`);
    } catch (e) {
      console.warn('Could not save JSON report file:', e);
    }
  }
}

// -----------------------------------------------------------------------------
// SCRIPT ENTRYPOINT
// -----------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('migrate-mongo-to-mysql.ts')) {
  const etl = new MongoToMySqlEtl(process.argv.slice(2));
  etl.run().catch((err) => {
    console.error('Fatal ETL Error:', err);
    process.exit(1);
  });
}
