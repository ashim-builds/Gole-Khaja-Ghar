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
import { OrderStatus, OrderType, UserRole } from '@prisma/client';

function mapOrder(doc: any) {
  if (!doc) return null;
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
    status: doc.status ? doc.status.toLowerCase() : 'pending',
    paymentMethod: 'cod',
    paymentStatus: doc.status === 'COMPLETED' ? 'paid' : 'pending',
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

    const { customerInfo, orderType: rawOrderType, paymentMethod, address, notes, items } = validation.data;
    const userId = req.user?.userId;

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

    // Transactional Order + Items + KOT + Notification creation
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
          notes: notes || null,
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

      // Role broadcast notification for Admin & Kitchen
      await tx.notification.create({
        data: {
          targetRole: 'ADMIN',
          recipientType: 'ROLE_BROADCAST',
          type: 'ORDER_CREATED',
          title: 'New Order Received',
          body: `Order #${orderNumber} • ${customerInfo.name} • Rs. ${totalAmount.toFixed(2)}`,
          linkUrl: `/admin/orders/${order.id}`,
        },
      });

      return order;
    });

    // Send push notification & alerts asynchronously
    sendPushToAdmin({
      title: `🛎 New Order — ${orderNumber}`,
      body: `${customerInfo.name} • Rs. ${totalAmount.toFixed(2)} • ${rawOrderType}`,
      url: `/admin/orders/${newOrder.id}`,
    }).catch(() => {});

    notifyAdminNewOrder(orderNumber, customerInfo.name, totalAmount, rawOrderType).catch(() => {});

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
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
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
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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
    const { id, paymentStatus } = req.body;
    if (paymentStatus !== 'pending' && paymentStatus !== 'paid') {
      res.status(400).json({ error: 'Invalid payment status. Must be pending or paid.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (paymentStatus === 'paid' && order.userId) {
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
        title: '💳 Payment Confirmed!',
        body: `Payment received for order #${order.orderNumber}.`,
        url: `/order/${order.orderNumber}`,
      }).catch(() => {});
    }

    res.json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
}

export async function getAdminLiveUpdates(_req: Request, res: Response): Promise<void> {
  try {
    const [recentOrders, unreadCount, pendingOrdersCount] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          targetRole: 'ADMIN',
          isRead: false,
        },
      }),
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        recentOrders: recentOrders.map(mapOrder),
        unreadCount,
        pendingOrdersCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('getAdminLiveUpdates error:', error);
    res.status(500).json({ error: 'Failed to fetch live updates' });
  }
}
