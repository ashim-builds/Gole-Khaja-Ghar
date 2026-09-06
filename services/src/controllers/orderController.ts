import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/schemas.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendPushToAdmin, sendPushToUser } from '../integrations/webpush.js';
import {
  notifyAdminNewOrder,
  notifyCustomerStatusChange,
  notifyCustomerPaymentConfirmed,
} from '../integrations/whatsapp.js';
import { BillStatus, PaymentMethod, PaymentStatus, OrderStatus, OrderType, UserRole } from '@prisma/client';
import { emitEvent, emitPaymentRecorded, emitOrderStatusChanged } from '../lib/socket.js';

const orderInclude = {
  items: {
    include: {
      product: true,
    },
  },
  bill: {
    include: {
      payments: true,
    },
  },
  tableSession: {
    include: {
      table: true,
      waiter: {
        include: {
          staffProfile: true,
        },
      },
      bill: {
        include: {
          payments: true,
        },
      },
    },
  },
  user: {
    include: {
      staffProfile: true,
    },
  },
};

function mapOrder(doc: any) {
  if (!doc) return null;
  const isTableSettled = doc.tableSession?.status === 'COMPLETED';
  const payments = doc.bill?.payments || doc.tableSession?.bill?.payments || [];
  const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

  // Check explicit bill status or payments
  const billStatus = doc.bill?.status || doc.tableSession?.bill?.status;
  let isPaid = false;
  if (billStatus === 'PAID') {
    isPaid = true;
  } else if (billStatus === 'UNPAID') {
    isPaid = false;
  } else if (payments.some((p: any) => p.status === 'PAID')) {
    isPaid = true;
  } else if (isTableSettled) {
    isPaid = true;
  }

  const isCompleted = doc.status === 'COMPLETED' || isTableSettled;
  const effectiveStatus = isCompleted ? 'completed' : (doc.status ? doc.status.toLowerCase() : 'pending');

  const isQrNote = doc.notes?.toLowerCase().includes('qr') || doc.notes?.toLowerCase().includes('fonepay') || doc.notes?.toLowerCase().includes('esewa') || doc.notes?.toLowerCase().includes('khalti');
  let paymentMethod = 'cod';
  if (latestPayment?.method) {
    paymentMethod = latestPayment.method.toLowerCase();
  } else if (isQrNote) {
    paymentMethod = 'qr';
  } else if (doc.paymentMethod) {
    paymentMethod = doc.paymentMethod.toLowerCase();
  }

  const txRef = latestPayment?.transactionReference || (doc.notes?.match(/Tx Ref:\s*([^\s|]+)/i)?.[1] || null);

  return {
    id: doc.id,
    _id: doc.id,
    orderNumber: doc.orderNumber,
    userId: doc.userId,
    customerInfo: {
      name: doc.customerName,
      phone: doc.customerPhone,
      email: doc.customerEmail || undefined,
    },
    orderType: doc.orderType ? doc.orderType.toLowerCase() : 'delivery',
    orderSource: doc.orderSource || 'CUSTOMER_WEB',
    status: effectiveStatus,
    paymentMethod,
    paymentStatus: isPaid ? 'paid' : 'pending',
    txRef,
    payments: payments.map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      transactionReference: p.transactionReference,
      createdAt: p.createdAt,
    })),
    tableSessionId: doc.tableSessionId,
    tableSession: doc.tableSession
      ? {
          id: doc.tableSession.id,
          tableNumber: doc.tableSession.table?.tableNumber,
          guestCount: doc.tableSession.guestCount,
          waiterId: doc.tableSession.waiterId,
          waiterName: doc.tableSession.waiter?.name || null,
          waiterCode: doc.tableSession.waiter?.staffProfile?.employeeCode || null,
        }
      : null,
    waiterName:
      doc.tableSession?.waiter?.name ||
      (doc.user?.role === 'WAITER' ? doc.user?.name : null) ||
      null,
    waiterCode:
      doc.tableSession?.waiter?.staffProfile?.employeeCode ||
      (doc.user?.staffProfile?.employeeCode || null),
    deliveryAddress: doc.deliveryAddress,
    address: doc.deliveryAddress,
    notes: doc.notes,
    totalAmount: doc.totalAmount ? Number(doc.totalAmount) : 0,
    subtotalAmount: doc.subtotalAmount ? Number(doc.subtotalAmount) : 0,
    deliveryCharge: doc.deliveryCharge ? Number(doc.deliveryCharge) : 0,
    discountAmount: doc.discountAmount ? Number(doc.discountAmount) : 0,
    items: (doc.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.image || '/images/logo.png',
          }
        : {
            name: item.productName,
            image: '/images/logo.png',
          },
      productName: item.productName,
      selectedVariantName: item.variantName,
      variantName: item.variantName,
      selectedWeightInGrams: item.selectedWeightInGrams,
      priceType: item.selectedWeightInGrams ? 'weight' : 'variant',
      unitPriceAtTimeOfOrder: item.unitPrice ? Number(item.unitPrice) : undefined,
      pricePerKgAtTimeOfOrder: item.pricePerKg ? Number(item.pricePerKg) : undefined,
      calculatedPrice: item.calculatedPrice ? Number(item.calculatedPrice) : 0,
      qty: item.quantity || 1,
      quantity: item.quantity || 1,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid order details.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { customerInfo, orderType: rawOrderType, paymentMethod, address, notes, txRef, items } = validation.data as any;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Please log in to your account to place an order.' });
      return;
    }

    let subtotalAmount = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isAvailable) {
        res.status(400).json({ error: `Product "${product?.name || 'Item'}" is unavailable or out of stock.` });
        return;
      }

      if (product.trackStock) {
        if (product.stockQuantity < item.qty) {
          res.status(400).json({
            error: product.stockQuantity <= 0
              ? `"${product.name}" is currently out of stock.`
              : `Only ${product.stockQuantity} units available for "${product.name}". Please reduce quantity.`
          });
          return;
        }
      }

      let calculatedPrice = 0;
      let unitPrice: number | null = null;
      let pricePerKg: number | null = null;
      let selectedVariantName: string | null = null;
      let selectedWeight: number | null = null;

      if (item.weightInGrams) {
        const MAX_WEIGHT_GRAMS = 20000;
        const MIN_WEIGHT_GRAMS = 1;
        if (item.weightInGrams < MIN_WEIGHT_GRAMS || item.weightInGrams > MAX_WEIGHT_GRAMS) {
          res.status(400).json({ error: 'Invalid weight. Must be between 1g and 20kg.' });
          return;
        }

        const primaryPrice = product.variants && product.variants.length > 0 ? Number(product.variants[0].price) : 0;
        if (primaryPrice <= 0) {
          res.status(400).json({ error: 'Product price is misconfigured.' });
          return;
        }

        pricePerKg = primaryPrice;
        selectedWeight = item.weightInGrams;
        calculatedPrice = (item.weightInGrams / 1000) * pricePerKg * item.qty;
      } else {
        const variant = product.variants.find((v) => v.name === item.variantName) || product.variants[0];
        if (!variant || Number(variant.price) < 0) {
          res.status(400).json({ error: `Invalid variant selected for ${product.name}.` });
          return;
        }

        unitPrice = Number(variant.price);
        selectedVariantName = variant.name;
        calculatedPrice = unitPrice * item.qty;
      }

      const itemTotal = Math.round(calculatedPrice * 100) / 100;
      subtotalAmount += itemTotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        variantName: selectedVariantName,
        selectedWeightInGrams: selectedWeight,
        unitPrice,
        pricePerKg,
        calculatedPrice: itemTotal,
        quantity: item.qty,
      });
    }

    subtotalAmount = Math.round(subtotalAmount * 100) / 100;

    const DELIVERY_THRESHOLD = 500;
    const DELIVERY_FEE = 50;
    const deliveryCharge =
      rawOrderType === 'delivery' && subtotalAmount < DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
    const totalAmount = Math.round((subtotalAmount + deliveryCharge) * 100) / 100;

    // Generate Order Number: GKG-1001
    const latestOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    let nextNumber = 1001;
    if (latestOrder && latestOrder.orderNumber) {
      const match = latestOrder.orderNumber.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }
    const orderNumber = `GKG-${nextNumber}`;
    const orderTypeEnum: OrderType = rawOrderType === 'pickup' ? 'PICKUP' : 'DELIVERY';

    const isQr = paymentMethod === 'qr';
    let finalNotes = notes || null;
    if (txRef && txRef.trim()) {
      finalNotes = finalNotes ? `${finalNotes} | Tx Ref: ${txRef.trim()}` : `Tx Ref: ${txRef.trim()}`;
    }

    // Transactional Order + Items + KOT + Bill/Payment + Stock Deduction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email || null,
          orderType: orderTypeEnum,
          orderSource: 'CUSTOMER_WEB',
          status: 'PENDING',
          deliveryAddress: rawOrderType === 'delivery' ? address || null : null,
          notes: finalNotes,
          subtotalAmount,
          deliveryCharge,
          discountAmount: 0,
          totalAmount,
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              productName: vi.productName,
              variantName: vi.variantName,
              selectedWeightInGrams: vi.selectedWeightInGrams,
              unitPrice: vi.unitPrice,
              pricePerKg: vi.pricePerKg,
              calculatedPrice: vi.calculatedPrice,
              quantity: vi.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Deduct stock for tracked products
      for (const vi of validatedItems) {
        if (vi.productId) {
          const prod = await tx.product.findUnique({ where: { id: vi.productId } });
          if (prod && prod.trackStock) {
            const newStock = Math.max(0, prod.stockQuantity - vi.quantity);
            await tx.product.update({
              where: { id: vi.productId },
              data: {
                stockQuantity: newStock,
                isAvailable: newStock > 0 ? prod.isAvailable : false,
              },
            });
          }
        }
      }

      // Automatic Kitchen Order Ticket (KOT)
      await tx.kotTicket.create({
        data: {
          orderId: order.id,
          status: 'QUEUED',
          items: {
            create: order.items.map((oi) => ({
              orderItemId: oi.id,
              itemName: oi.productName,
              itemDetails: oi.selectedWeightInGrams
                ? `${oi.selectedWeightInGrams}g`
                : oi.variantName || undefined,
              quantity: oi.quantity,
              status: 'PENDING',
            })),
          },
        },
      });

      // If user paid online via QR, create Bill and Payment in PENDING status (Admin must verify before confirming Paid)
      if (isQr) {
        const bill = await tx.bill.create({
          data: {
            billNumber: `INV-${Date.now().toString().slice(-6)}`,
            orderId: order.id,
            grossAmount: totalAmount,
            discountAmount: 0,
            taxAmount: 0,
            deliveryCharge,
            netAmount: totalAmount,
            status: BillStatus.UNPAID,
            settledAt: null,
          },
        });

        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: totalAmount,
            method: PaymentMethod.FONEPAY_QR,
            status: PaymentStatus.PENDING,
            transactionReference: txRef ? txRef.trim() : 'FONEPAY-QR',
            notes: 'Online FonePay QR payment at checkout (Awaiting Admin Bank Verification)',
          },
        });
      }

      // Role broadcast notification for Admin & Kitchen
      await tx.notification.create({
        data: {
          targetRole: 'ADMIN',
          recipientType: 'ROLE_BROADCAST',
          type: isQr ? 'PAYMENT_RECEIVED' : 'ORDER_CREATED',
          title: isQr ? 'FonePay Payment To Verify' : 'New Order Received',
          body: isQr
            ? `Order #${orderNumber} • ${customerInfo.name} submitted FonePay payment (Rs. ${totalAmount.toFixed(2)})${txRef ? ` | Ref: ${txRef}` : ''} - Check bank & confirm.`
            : `Order #${orderNumber} • ${customerInfo.name} • Rs. ${totalAmount.toFixed(2)}`,
          linkUrl: `/admin/orders/${order.id}`,
        },
      });

      return order;
    });

    // Send push notification & alerts asynchronously
    sendPushToAdmin({
      title: isQr ? `Online Payment — ${orderNumber}` : `New Order — ${orderNumber}`,
      body: isQr
        ? `${customerInfo.name} paid Rs. ${totalAmount.toFixed(2)} via FonePay QR${txRef ? ` (Ref: ${txRef})` : ''}`
        : `${customerInfo.name} • Rs. ${totalAmount.toFixed(2)} • ${rawOrderType}`,
      url: `/admin/orders/${newOrder.id}`,
    }).catch(() => {});

    notifyAdminNewOrder(orderNumber, customerInfo.name, totalAmount, rawOrderType).catch(() => {});

    emitEvent('order:status_changed', {
      orderId: newOrder.id,
      orderNumber,
      status: 'PENDING',
      paymentMethod: isQr ? 'qr' : 'cod',
      paymentStatus: isQr ? 'paid' : 'pending',
    });

    if (isQr) {
      emitPaymentRecorded({
        orderId: newOrder.id,
        orderNumber,
        customerName: customerInfo.name,
        amount: totalAmount,
        paymentMethod: 'FONEPAY_QR',
        status: 'PAID',
        txRef: txRef || undefined,
        isOnline: true,
      });
    }

    res.status(201).json({
      success: true,
      orderNumber,
      orderId: newOrder.id,
      deliveryCharge,
      grandTotal: totalAmount,
      totalAmount,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to process checkout.' });
  }
}

const orderInclude = {
  items: {
    include: {
      product: true,
    },
  },
  bill: {
    include: {
      payments: true,
    },
  },
  tableSession: {
    include: {
      table: true,
      bill: {
        include: {
          payments: true,
        },
      },
    },
  },
};

export async function getOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { orderNumber } = req.params;
    if (!orderNumber || typeof orderNumber !== 'string') {
      res.status(400).json({ error: 'Invalid order number' });
      return;
    }

    const cleanNumber = orderNumber.trim();
    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanNumber },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('getOrderStatus error:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
}

export async function getUserOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, orders: orders.map(mapOrder) });
  } catch (error) {
    console.error('getUserOrders error:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
}

export async function cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { orderNumber } = req.params;
    if (!orderNumber || typeof orderNumber !== 'string') {
      res.status(400).json({ error: 'Invalid order number' });
      return;
    }

    const cleanNumber = orderNumber.trim();
    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanNumber },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.userId || order.userId !== req.user.userId) {
      res.status(403).json({ error: 'Unauthorized access to this order' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({
        error: `Only pending orders can be cancelled. Order is already ${order.status.toLowerCase()}.`,
      });
      return;
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      }),
      prisma.kotTicket.updateMany({
        where: { orderId: order.id, status: 'QUEUED' },
        data: { status: 'CANCELLED' },
      }),
      prisma.notification.create({
        data: {
          targetRole: 'ADMIN',
          recipientType: 'ROLE_BROADCAST',
          type: 'ORDER_STATUS_CHANGED',
          title: 'Order Cancelled',
          body: `Order #${order.orderNumber} was cancelled by customer.`,
          linkUrl: `/admin/orders/${order.id}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: req.user.userId,
          recipientType: 'USER',
          type: 'ORDER_STATUS_CHANGED',
          title: 'Order Cancelled',
          body: `Your order #${order.orderNumber} has been cancelled.`,
          linkUrl: `/orders`,
        },
      }),
    ]);

    emitOrderStatusChanged({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'CANCELLED',
    });

    sendPushToAdmin({
      title: 'Order Cancelled',
      body: `Order ${order.orderNumber} was cancelled by the customer.`,
      url: `/admin/orders/${order.id}`,
    }).catch(() => {});

    sendPushToUser(req.user.userId, {
      title: 'Order Cancelled',
      body: `Your order ${order.orderNumber} has been cancelled successfully.`,
      url: `/order/${order.orderNumber}`,
    }).catch(() => {});

    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
}

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status, query, limit = '50', page = '1' } = req.query;
    const where: any = {};

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status.toUpperCase() as OrderStatus;
    }

    if (query && typeof query === 'string') {
      const clean = query.trim();
      where.OR = [
        { orderNumber: { contains: clean } },
        { customerName: { contains: clean } },
        { customerPhone: { contains: clean } },
      ];
    }

    const pageSize = parseInt(limit as string, 10) || 50;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      orders: orders.map(mapOrder),
      pagination: {
        total,
        page: currentPage,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('getAdminOrders error:', error);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
}

export async function getAdminOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('getAdminOrderById error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const validation = updateOrderStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid status' });
      return;
    }

    const { id, status: rawStatus } = validation.data;
    const status = rawStatus.toUpperCase() as OrderStatus;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (order.userId) {
      const statusMeta: Record<string, { title: string; body: string }> = {
        PENDING: { title: 'Order Placed', body: `Your order #${order.orderNumber} has been received.` },
        CONFIRMED: { title: 'Order Confirmed', body: `Your order #${order.orderNumber} has been confirmed.` },
        PREPARING: { title: 'Order Being Prepared', body: `Your order #${order.orderNumber} is being prepared in the kitchen.` },
        READY: { title: 'Order Ready', body: order.orderType === 'DELIVERY' ? `Your order #${order.orderNumber} is out for delivery.` : `Your order #${order.orderNumber} is ready for pickup.` },
        COMPLETED: { title: 'Order Completed', body: `Your order #${order.orderNumber} has been completed. Thank you!` },
        CANCELLED: { title: 'Order Cancelled', body: `Your order #${order.orderNumber} has been cancelled.` },
      };

      const meta = statusMeta[status];
      if (meta) {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            recipientType: 'USER',
            type: 'ORDER_STATUS_CHANGED',
            title: meta.title,
            body: meta.body,
            linkUrl: `/order/${order.orderNumber}`,
          },
        }).catch(() => {});

        sendPushToUser(order.userId, {
          title: meta.title,
          body: meta.body,
          url: `/order/${order.orderNumber}`,
        }).catch(() => {});
      }
    }

    res.json({ success: true, order: mapOrder(updated) });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function updatePaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id || req.body.id;
    const { paymentStatus } = req.body;
    if (paymentStatus !== 'pending' && paymentStatus !== 'paid') {
      res.status(400).json({ error: 'Invalid payment status. Must be pending or paid.' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        bill: { include: { payments: true } },
        tableSession: { include: { bill: { include: { payments: true } } } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const isPaid = paymentStatus === 'paid';

    await prisma.$transaction(async (tx) => {
      if (order.bill) {
        await tx.bill.update({
          where: { id: order.bill.id },
          data: {
            status: isPaid ? BillStatus.PAID : BillStatus.UNPAID,
            settledAt: isPaid ? new Date() : null,
          },
        });
        if (isPaid) {
          const existingPayments = await tx.payment.findMany({
            where: { billId: order.bill.id },
          });
          if (existingPayments.length > 0) {
            await tx.payment.updateMany({
              where: { billId: order.bill.id },
              data: { status: PaymentStatus.PAID },
            });
          } else {
            const isQr = order.notes?.toLowerCase().includes('qr') || order.notes?.toLowerCase().includes('fonepay');
            await tx.payment.create({
              data: {
                billId: order.bill.id,
                amount: order.totalAmount,
                method: isQr ? PaymentMethod.FONEPAY_QR : PaymentMethod.CASH,
                status: PaymentStatus.PAID,
                notes: 'Payment confirmed by Admin',
              },
            });
          }
        } else {
          await tx.payment.updateMany({
            where: { billId: order.bill.id },
            data: { status: PaymentStatus.PENDING },
          });
        }
      } else if (order.tableSessionId) {
        await tx.bill.updateMany({
          where: { tableSessionId: order.tableSessionId },
          data: { status: isPaid ? BillStatus.PAID : BillStatus.UNPAID, settledAt: isPaid ? new Date() : null },
        });
      } else {
        const isQr = order.notes?.toLowerCase().includes('qr') || order.notes?.toLowerCase().includes('fonepay');
        const bill = await tx.bill.create({
          data: {
            billNumber: `INV-${Date.now().toString().slice(-6)}`,
            orderId: order.id,
            grossAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            taxAmount: 0,
            deliveryCharge: order.deliveryCharge,
            netAmount: order.totalAmount,
            status: isPaid ? BillStatus.PAID : BillStatus.UNPAID,
            settledAt: isPaid ? new Date() : null,
          },
        });

        if (isPaid) {
          await tx.payment.create({
            data: {
              billId: bill.id,
              amount: order.totalAmount,
              method: isQr ? PaymentMethod.FONEPAY_QR : PaymentMethod.CASH,
              status: PaymentStatus.PAID,
              notes: 'Payment confirmed by Admin',
            },
          });
        }
      }
    });

    const updated = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        bill: { include: { payments: true } },
        tableSession: { include: { bill: { include: { payments: true } } } },
      },
    });

    if (isPaid && order.userId) {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          recipientType: 'USER',
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Confirmed',
          body: `Payment received for order #${order.orderNumber}.`,
          linkUrl: `/order/${order.orderNumber}`,
        },
      }).catch(() => {});

      sendPushToUser(order.userId, {
        title: 'Payment Confirmed',
        body: `Payment received for order #${order.orderNumber}.`,
        url: `/order/${order.orderNumber}`,
      }).catch(() => {});
    }

    emitEvent('order:status_changed', { id: order.id, orderNumber: order.orderNumber, paymentStatus });
    emitPaymentRecorded({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
      paymentMethod: 'CASH',
      status: isPaid ? 'PAID' : 'PENDING',
    });

    res.json({ success: true, order: mapOrder(updated) });
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
}

export async function getOrderForPayment(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      res.status(400).json({ error: 'Order ID or number is required' });
      return;
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
      },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('getOrderForPayment error:', error);
    res.status(500).json({ error: 'Failed to fetch order for payment' });
  }
}

export async function settleOnlinePayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { paymentMethod, txRef, amount } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const method = paymentMethod || 'FONEPAY_QR';
    const validMethod = Object.values(PaymentMethod).includes(method) ? method : PaymentMethod.FONEPAY_QR;
    const paymentAmount = Number(amount) || Number(order.totalAmount);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          notes: txRef ? `${order.notes ? order.notes + ' | ' : ''}Tx Ref: ${txRef}` : order.notes,
        },
        include: orderInclude,
      });

      if (order.bill) {
        await tx.bill.update({
          where: { id: order.bill.id },
          data: { status: BillStatus.UNPAID, settledAt: null },
        });
        await tx.payment.create({
          data: {
            billId: order.bill.id,
            amount: paymentAmount,
            method: validMethod,
            status: PaymentStatus.PENDING,
            transactionReference: txRef ? String(txRef).trim() : 'FONEPAY-SUBMITTED',
            notes: 'Submitted online by customer, awaiting admin verification',
          },
        });
      } else {
        const bill = await tx.bill.create({
          data: {
            billNumber: `INV-${Date.now().toString().slice(-6)}`,
            orderId: order.id,
            grossAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            taxAmount: 0,
            deliveryCharge: order.deliveryCharge,
            netAmount: order.totalAmount,
            status: BillStatus.UNPAID,
            settledAt: null,
          },
        });
        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: paymentAmount,
            method: validMethod,
            status: PaymentStatus.PENDING,
            transactionReference: txRef ? String(txRef).trim() : 'FONEPAY-SUBMITTED',
            notes: 'Submitted online by customer, awaiting admin verification',
          },
        });
      }

      return updatedOrder;
    });

    const refreshedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    });

    // Broadcast payment and order status
    emitPaymentRecorded({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: paymentAmount,
      paymentMethod: method,
      status: 'PAID',
      txRef: txRef || undefined,
      isOnline: true,
    });

    emitEvent('order:status_changed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: refreshedOrder?.status || order.status,
      paymentMethod: method,
      paymentStatus: 'paid',
    });

    // Notify Super Admin
    await prisma.notification.create({
      data: {
        targetRole: 'ADMIN',
        recipientType: 'ROLE_BROADCAST',
        type: 'PAYMENT_RECEIVED',
        title: `Payment Received: #${order.orderNumber}`,
        body: `Rs. ${paymentAmount.toFixed(2)} via ${method}${txRef ? ` (Ref: ${txRef})` : ''}`,
        linkUrl: `/admin/orders/${order.id}`,
      },
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      order: mapOrder(refreshedOrder),
    });
  } catch (error) {
    console.error('settleOnlinePayment error:', error);
    res.status(500).json({ error: 'Failed to settle online payment' });
  }
}

export async function getAdminLiveUpdates(req: Request, res: Response): Promise<void> {
  try {
    const [
      totalProducts,
      availableProducts,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PREPARING' } }),
      prisma.order.count({ where: { status: 'READY' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        availableProducts,
        totalOrders,
        pendingOrders,
        preparing: preparingOrders,
        ready: readyOrders,
      },
      recentOrders: recentOrders.map(mapOrder),
    });
  } catch (error) {
    console.error('getAdminLiveUpdates error:', error);
    res.status(500).json({ error: 'Failed to fetch live updates' });
  }
}


