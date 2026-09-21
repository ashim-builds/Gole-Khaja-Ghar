import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer, clientUrl: string): Server {
  io = new Server(httpServer, {
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    transports: ["websocket", "polling"],
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        if (
          cleanOrigin === clientUrl.replace(/\/+$/, '') ||
          cleanOrigin.endsWith('.onrender.com') ||
          cleanOrigin.includes('localhost') ||
          cleanOrigin.includes('127.0.0.1')
        ) {
          callback(null, cleanOrigin);
        } else {
          callback(null, cleanOrigin);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_role', (role: string) => {
      if (role) {
        socket.join(`role:${role.toLowerCase()}`);
      }
    });

    socket.on('join_order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('join_table', (tableId: string) => {
      if (tableId) {
        socket.join(`table:${tableId}`);
      }
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitEvent(event: string, payload: any): void {
  if (io) {
    io.emit(event, payload);
  }
}

export function emitToRole(role: string, event: string, payload: any): void {
  if (io) {
    io.to(`role:${role.toLowerCase()}`).emit(event, payload);
    io.emit(event, payload);
  }
}

export function emitKotStatusChanged(payload: {
  kotTicketId: string;
  ticketNumber: number;
  status: string;
  tableNumber?: string;
  tableSessionId?: string | null;
  orderId?: string;
  items?: any[];
}): void {
  emitEvent('kot:status_changed', payload);
}

export function emitWaiterReadyAlert(payload: {
  kotTicketId: string;
  ticketNumber: number;
  tableNumber: string;
  tableSessionId?: string | null;
  waiterId?: string | null;
  waiterName?: string;
  itemsSummary?: string;
}): void {
  emitEvent('waiter:ready_alert', payload);
}

export function emitOrderDelivered(payload: {
  kotTicketId: string;
  tableNumber: string;
  orderId?: string;
  deliveredAt: string;
}): void {
  emitEvent('order:delivered', payload);
}

export function emitTableUpdated(payload: {
  tableId: string;
  tableNumber: string;
  status: string;
  activeSession?: any;
}): void {
  emitEvent('table:updated', payload);
}

export function emitPaymentRecorded(payload: {
  billId?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
  tableNumber?: string;
  txRef?: string;
  isOnline?: boolean;
}): void {
  emitEvent('payment:recorded', payload);
}

export function emitOrderStatusChanged(payload: {
  orderId?: string;
  orderNumber?: string;
  status: string;
}): void {
  emitEvent('order:status_changed', payload);
}

export function emitOrderCreated(payload: {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  totalAmount?: number;
  orderType?: string;
}): void {
  emitEvent('order:created', payload);
  emitToRole('admin', 'order:created', payload);
  emitToRole('kitchen', 'order:created', payload);
}

export function emitNotification(payload: {
  id?: string;
  _id?: string;
  userId?: string | null;
  targetRole?: string | null;
  recipientType?: string;
  type?: string;
  title: string;
  body?: string;
  message?: string;
  linkUrl?: string | null;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string | Date;
}): void {
  const formatted = {
    id: payload.id || payload._id || `notif-${Date.now()}`,
    _id: payload.id || payload._id || `notif-${Date.now()}`,
    userId: payload.userId || null,
    targetRole: payload.targetRole || null,
    recipientType: payload.recipientType || 'USER',
    type: payload.type || 'SYSTEM_ALERT',
    title: payload.title,
    body: payload.body || payload.message || '',
    message: payload.body || payload.message || '',
    linkUrl: payload.linkUrl || null,
    read: payload.read ?? payload.isRead ?? false,
    isRead: payload.read ?? payload.isRead ?? false,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  emitEvent('notification:new', formatted);
  if (payload.targetRole === 'ADMIN' || payload.recipientType === 'ROLE_BROADCAST') {
    emitEvent('notification:admin', formatted);
    emitToRole('admin', 'notification:admin', formatted);
  }
  if (payload.userId) {
    emitEvent(`notification:user:${payload.userId}`, formatted);
    emitEvent('notification:user', formatted);
  }
}

export function emitProductUpdated(payload?: any): void {
  emitEvent('product:updated', payload);
  emitEvent('menu:updated', payload);
}

