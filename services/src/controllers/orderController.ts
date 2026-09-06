import { Request, Response } from 'express';
import mongoose from 'mongoose';
import OrderModel from '../models/Order.js';
import ProductModel from '../models/Product.js';
import NotificationModel from '../models/Notification.js';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/schemas.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendPushToAdmin, sendPushToUser } from '../integrations/webpush.js';
import {
  notifyAdminNewOrder,
  notifyCustomerStatusChange,
  notifyCustomerPaymentConfirmed,
} from '../integrations/whatsapp.js';

export async function checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid order details.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { customerInfo, orderType, paymentMethod, address, notes, items } = validation.data;
    const userId = req.user?.userId;

    let finalTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        res.status(400).json({ error: 'Invalid product ID.' });
        return;
      }

      const product = await ProductModel.findById(item.productId);
      if (!product || !product.available) {
        res.status(400).json({ error: 'Product is unavailable or out of stock.' });
        return;
      }

      let calculatedPrice = 0;
      const orderItemRecord: any = {
        product: product._id,
        productName: product.name,
        qty: item.qty,
        priceType: product.priceType,
      };

      if (product.priceType === 'weight') {
        const MAX_WEIGHT_GRAMS = 20000;
        const MIN_WEIGHT_GRAMS = 1;
        if (
          !item.weightInGrams ||
          item.weightInGrams < MIN_WEIGHT_GRAMS ||
          item.weightInGrams > MAX_WEIGHT_GRAMS
        ) {
          res.status(400).json({ error: 'Invalid weight. Must be between 1g and 20kg.' });
          return;
        }

        if (!product.allowCustomWeight) {
          const isValidWeightOption = product.weightOptions?.some((opt: any) => {
            const optGrams = opt.unit === 'kg' ? opt.value * 1000 : opt.value;
            return optGrams === item.weightInGrams;
          });
          if (!isValidWeightOption) {
            res.status(400).json({ error: `Invalid weight option selected for ${product.name}.` });
            return;
          }
        }

        if (!product.pricePerKg || product.pricePerKg <= 0) {
          res.status(400).json({ error: 'Product price is misconfigured.' });
          return;
        }

        calculatedPrice = (item.weightInGrams / 1000) * product.pricePerKg * item.qty;
        orderItemRecord.selectedWeightInGrams = item.weightInGrams;
        orderItemRecord.pricePerKgAtTimeOfOrder = product.pricePerKg;
      } else if (product.priceType === 'variant') {
        if (!item.variantName) {
          res.status(400).json({ error: `Missing variant selection for ${product.name}.` });
          return;
        }

        const variant = product.variants?.find((v: any) => v.name === item.variantName);
        if (!variant || variant.price < 0) {
          res.status(400).json({ error: `Invalid variant selected for ${product.name}.` });
          return;
        }

        calculatedPrice = variant.price * item.qty;
        orderItemRecord.selectedVariantName = variant.name;
        orderItemRecord.unitPriceAtTimeOfOrder = variant.price;
      }

      orderItemRecord.calculatedPrice = Math.round(calculatedPrice * 100) / 100;
      finalTotal += orderItemRecord.calculatedPrice;
      validatedItems.push(orderItemRecord);
    }

    finalTotal = Math.round(finalTotal * 100) / 100;

    const DELIVERY_THRESHOLD = 100;
    const DELIVERY_FEE = 10;
    const deliveryCharge =
      orderType === 'delivery' && finalTotal < DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
    const grandTotal = Math.round((finalTotal + deliveryCharge) * 100) / 100;

    const latestOrder = await OrderModel.findOne().sort({ createdAt: -1 });
    let nextNumber = 1000;
    if (latestOrder && latestOrder.orderNumber && latestOrder.orderNumber.startsWith('CC-')) {
      const lastNum = parseInt(latestOrder.orderNumber.replace('CC-', ''));
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    const orderNumber = `CC-${nextNumber}`;

    const newOrder = await OrderModel.create({
      orderNumber,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || undefined,
      },
      orderType,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      address: orderType === 'delivery' ? address || undefined : undefined,
      notes: notes || undefined,
      items: validatedItems,
      totalAmount: grandTotal,
      deliveryCharge,
      status: 'pending',
    });

    // Admin database notification
    await NotificationModel.create({
      recipientType: 'ADMIN',
      recipientId: 'admin',
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `Order #${orderNumber}\nCustomer placed a new order.\nNPR ${grandTotal.toFixed(2)}`,
      orderId: newOrder._id,
    }).catch((err) => console.error('Failed to create admin notification:', err));

    // Admin Web Push
    sendPushToAdmin({
      title: `🛎 New Order — ${orderNumber}`,
      body: `${customerInfo.name} • Rs. ${grandTotal.toFixed(2)} • ${orderType}`,
      url: `/admin/orders/${newOrder._id}`,
    }).catch(() => {});

    // Admin WhatsApp
    notifyAdminNewOrder(orderNumber, customerInfo.name, grandTotal, orderType).catch(() => {});

    res.status(201).json({
      success: true,
      orderNumber,
      orderId: newOrder._id.toString(),
      deliveryCharge,
      grandTotal,
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

    const cleanNumber = orderNumber.trim().slice(0, 50);
    const order = await OrderModel.findOne({ orderNumber: cleanNumber })
      .populate('items.product', 'name image slug')
      .lean();

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
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

    const orders = await OrderModel.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, orders });
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

    const cleanNumber = orderNumber.trim().slice(0, 50);
    const order = await OrderModel.findOne({ orderNumber: cleanNumber });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.userId || order.userId.toString() !== req.user.userId) {
      res.status(403).json({ error: 'Unauthorized access to this order' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({
        error: `Only pending orders can be cancelled. Order is already ${order.status}.`,
      });
      return;
    }

    order.status = 'cancelled';
    await order.save();

    await NotificationModel.create({
      recipientType: 'ADMIN',
      recipientId: 'admin',
      type: 'ORDER_CANCELLED_BY_USER',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber}\nCustomer cancelled the order.`,
      orderId: order._id,
    }).catch(() => {});

    await NotificationModel.create({
      recipientType: 'USER',
      recipientId: req.user.userId,
      type: 'ORDER_CANCELLED',
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.`,
      orderId: order._id,
    }).catch(() => {});

    sendPushToAdmin({
      title: 'Order Cancelled',
      body: `Order ${order.orderNumber} was cancelled by the customer.`,
      url: `/admin/orders/${order._id}`,
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
    const filter: any = {};

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    if (query && typeof query === 'string') {
      const clean = query.trim();
      filter.$or = [
        { orderNumber: { $regex: clean, $options: 'i' } },
        { 'customerInfo.name': { $regex: clean, $options: 'i' } },
        { 'customerInfo.phone': { $regex: clean, $options: 'i' } },
      ];
    }

    const pageSize = parseInt(limit as string, 10) || 50;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      OrderModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await OrderModel.findById(id).populate('items.product').lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
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

    const { id, status } = validation.data;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const previousStatus = order.status;
    if (previousStatus !== status) {
      order.status = status;
      await order.save();

      if (order.userId) {
        const statusMeta: Record<string, { type: any; title: string; body: string }> = {
          pending: {
            type: 'ORDER_PLACED',
            title: 'Order Placed',
            body: `Your order #${order.orderNumber} has been placed successfully.`,
          },
          confirmed: {
            type: 'ORDER_CONFIRMED',
            title: 'Order Confirmed',
            body: `Your order #${order.orderNumber} has been confirmed.`,
          },
          preparing: {
            type: 'ORDER_PREPARING',
            title: 'Order Being Prepared',
            body: `Your order #${order.orderNumber} is being prepared.`,
          },
          ready: {
            type: 'ORDER_READY',
            title: 'Order Ready',
            body:
              order.orderType === 'delivery'
                ? `Your order #${order.orderNumber} is ready for delivery.`
                : `Your order #${order.orderNumber} is ready for pickup.`,
          },
          completed: {
            type: 'ORDER_COMPLETED',
            title: 'Order Completed',
            body: `Your order #${order.orderNumber} has been completed.`,
          },
          cancelled: {
            type: 'ORDER_CANCELLED',
            title: 'Order Cancelled',
            body: `Your order #${order.orderNumber} has been cancelled.`,
          },
        };

        const meta = statusMeta[status];
        if (meta) {
          await NotificationModel.create({
            recipientType: 'USER',
            recipientId: order.userId.toString(),
            type: meta.type,
            title: meta.title,
            message: meta.body,
            orderId: order._id,
          }).catch(() => {});

          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
          sendPushToUser(order.userId.toString(), {
            title: meta.title,
            body: meta.body,
            url: `${clientUrl}/order/${order.orderNumber}`,
          }).catch(() => {});

          if (order.customerInfo?.phone) {
            notifyCustomerStatusChange(
              order.customerInfo.phone,
              order.customerInfo.name,
              order.orderNumber,
              status,
              `${clientUrl}/order/${order.orderNumber}`
            ).catch(() => {});
          }
        }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function updatePaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id, paymentStatus } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    if (paymentStatus !== 'pending' && paymentStatus !== 'paid') {
      res.status(400).json({ error: 'Invalid payment status. Must be pending or paid.' });
      return;
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const previousStatus = order.paymentStatus;
    if (previousStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      await order.save();

      if (paymentStatus === 'paid' && order.userId) {
        const message = `Payment received for order #${order.orderNumber}.`;
        await NotificationModel.create({
          recipientType: 'USER',
          recipientId: order.userId.toString(),
          type: 'ORDER_CONFIRMED',
          title: 'Payment Confirmed',
          message,
          orderId: order._id,
        }).catch(() => {});

        sendPushToUser(order.userId.toString(), {
          title: '💳 Payment Confirmed!',
          body: message,
          url: `/order/${order.orderNumber}`,
        }).catch(() => {});

        if (order.customerInfo?.phone) {
          notifyCustomerPaymentConfirmed(
            order.customerInfo.phone,
            order.customerInfo.name,
            order.orderNumber
          ).catch(() => {});
        }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
}

export async function getAdminLiveUpdates(_req: Request, res: Response): Promise<void> {
  try {
    const [recentOrders, unreadCount, pendingOrdersCount] = await Promise.all([
      OrderModel.find().sort({ createdAt: -1 }).limit(10).lean(),
      NotificationModel.countDocuments({ recipientType: 'ADMIN', read: false }),
      OrderModel.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      success: true,
      data: {
        recentOrders,
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
