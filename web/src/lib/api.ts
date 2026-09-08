export interface Product {
  id: string;
  slug: string;
  name: string;
  priceType: 'weight' | 'variant';
  pricePerKg?: number;
  variants?: { name: string; price: number }[];
  weightOptions?: { value: number; unit: string }[];
  allowCustomWeight?: boolean;
  trackStock?: boolean;
  stockQuantity?: number;
  lowStockAlert?: number;
  category: string;
  image: string;
  images: string[];
  description: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface CartProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceType: 'weight' | 'variant';
  pricePerKg?: number;
}

export interface CartItem {
  cartItemId: string;
  product: CartProduct;
  qty: number;
  weightInGrams?: number;
  variantName?: string;
  variantPrice?: number;
}

export interface OrderItem {
  product: {
    _id?: string;
    name?: string;
    image?: string;
    slug?: string;
  } | string;
  productName: string;
  qty: number;
  priceType: 'weight' | 'variant';
  selectedWeightInGrams?: number;
  pricePerKgAtTimeOfOrder?: number;
  selectedVariantName?: string;
  unitPriceAtTimeOfOrder?: number;
  calculatedPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId?: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  orderType: 'pickup' | 'delivery';
  paymentMethod: 'cod' | 'qr';
  paymentStatus: 'pending' | 'paid';
  address?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientType: 'USER' | 'ADMIN';
  recipientId: string;
  type: string;
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

const AUTH_TOKEN_KEY = 'golu_auth_token';
const ADMIN_TOKEN_KEY = 'golu_admin_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {}
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function removeAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

function getBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    let clean = (envUrl as string).trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean += '/api';
    }
    return clean;
  }
  return '/api';
}

export function getGoogleAuthUrl(redirectPath?: string): string {
  const baseUrl = getBaseUrl();
  const endpoint = `${baseUrl}/auth/google`;
  if (redirectPath && redirectPath.startsWith('/')) {
    return `${endpoint}?redirect=${encodeURIComponent(redirectPath)}`;
  }
  return endpoint;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isAdminEndpoint = endpoint.startsWith('/admin') || endpoint.startsWith('/notifications/admin');
  const token = isAdminEndpoint ? (getAdminToken() || getAuthToken()) : (getAuthToken() || getAdminToken());

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // ── Authentication ──
  auth: {
    async register(data: { name: string; email: string; phone?: string; password: string }) {
      return request<{ success: boolean; otpSent?: boolean; message?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async verifyOtp(email: string, otp: string) {
      const res = await request<{ success: boolean; token?: string; user: UserProfile }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },
    async resendOtp(email: string) {
      return request<{ success: boolean; message: string }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    async login(data: { email?: string; identifier?: string; password: string }) {
      const res = await request<{ success: boolean; token?: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },
    async getMe() {
      return request<{ success: boolean; user: UserProfile }>('/auth/me');
    },
    async logout() {
      try {
        return await request<{ success: boolean }>('/auth/logout', { method: 'POST' });
      } finally {
        removeAuthToken();
      }
    },
    async adminLogin(password: string) {
      const res = await request<{ success: boolean; token?: string }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (res.token) {
        setAdminToken(res.token);
      }
      return res;
    },
    async adminLogout() {
      try {
        return await request<{ success: boolean }>('/auth/admin/logout', { method: 'POST' });
      } finally {
        removeAdminToken();
      }
    },
  },

  // ── Admin Waiters & Management ──
  admin: {
    waiters: {
      async list(role?: string) {
        const qs = role ? `?role=${role}` : '';
        return request<{
          success: boolean;
          waiters: Array<{
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            role?: string;
            employeeCode: string;
            isActive: boolean;
            notes: string;
            createdAt: string;
          }>;
          staff: Array<{
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            role?: string;
            employeeCode: string;
            isActive: boolean;
            notes: string;
            createdAt: string;
          }>;
        }>(`/admin/waiters${qs}`);
      },
      async create(data: {
        name: string;
        phone: string;
        email?: string;
        password: string;
        employeeCode: string;
        role?: 'WAITER' | 'KITCHEN';
        notes?: string;
      }) {
        return request<{ success: boolean; waiter: any }>('/admin/waiters', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      async delete(id: string) {
        return request<{ success: boolean; message: string }>(`/admin/waiters/${id}`, {
          method: 'DELETE',
        });
      },
    },
    async testPush() {
      return request<{ success: boolean; message: string }>('/admin/test-push', {
        method: 'POST',
      });
    },
  },

  // ── Products & Catalog ──
  products: {
    async getAll(category?: string, query?: string, availableOnly?: boolean, page?: number, limit?: number) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (query) params.set('query', query);
      if (availableOnly) params.set('availableOnly', 'true');
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<{
        success: boolean;
        products: Product[];
        pagination?: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean };
      }>(`/products${qs}`);
    },
    async getBySlug(slug: string) {
      return request<{ success: boolean; product: Product }>(`/products/${slug}`, {
        cache: 'no-store',
      });
    },
    async getFeatured() {
      return request<{ success: boolean; products: Product[] }>('/products/featured', {
        cache: 'no-store',
      });
    },
    async getCategories() {
      return request<{ success: boolean; categories: string[] }>('/products/categories', {
        cache: 'no-store',
      });
    },
    async create(formData: FormData) {
      return request<{ success: boolean; product: Product }>('/admin/products', {
        method: 'POST',
        body: formData,
      });
    },
    async update(id: string, formData: FormData) {
      return request<{ success: boolean; product: Product }>(`/admin/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
    },
    async delete(id: string) {
      return request<{ success: boolean }>(`/admin/products/${id}`, {
        method: 'DELETE',
      });
    },
    async toggleStock(id: string, available: boolean) {
      return request<{ success: boolean; product: Product }>(`/admin/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ available }),
      });
    },
    async adjustStock(id: string, data: { action: 'add' | 'reduce' | 'set'; quantity: number; notes?: string }) {
      return request<{ success: boolean; product: Product; newStock: number }>(`/admin/products/${id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ── Cart ──
  cart: {
    async get() {
      return request<{ success: boolean; items: CartItem[] }>('/cart');
    },
    async sync(items: CartItem[]) {
      return request<{ success: boolean }>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    },
    async clear() {
      return request<{ success: boolean }>('/cart', { method: 'DELETE' });
    },
  },

  // ── Orders ──
  orders: {
    async checkout(payload: any) {
      return request<{
        success: boolean;
        orderNumber: string;
        orderId: string;
        deliveryCharge: number;
        grandTotal: number;
      }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async getStatus(orderNumber: string) {
      return request<{ success: boolean; order: Order }>(`/orders/${orderNumber}/status`, {
        cache: 'no-store',
      });
    },
    async getUserOrders() {
      return request<{ success: boolean; orders: Order[] }>('/orders/user', {
        cache: 'no-store',
      });
    },
    async cancel(orderNumber: string) {
      return request<{ success: boolean; status: string }>(`/orders/${orderNumber}/cancel`, {
        method: 'POST',
      });
    },
    async getAdminOrders(params?: { status?: string; query?: string; page?: number; limit?: number }) {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.query) qs.set('query', params.query);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString() ? `?${qs.toString()}` : '';
      return request<{
        success: boolean;
        orders: Order[];
        pagination: { total: number; page: number; pageSize: number; totalPages: number };
      }>(`/admin/orders${q}`, { cache: 'no-store' });
    },
    async getAdminOrderById(id: string) {
      return request<{ success: boolean; order: Order }>(`/admin/orders/${id}`, {
        cache: 'no-store',
      });
    },
    async updateStatus(id: string, status: string) {
      return request<{ success: boolean; order: Order }>('/admin/orders/status', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
    },
    async updatePayment(id: string, paymentStatus: 'pending' | 'paid') {
      return request<{ success: boolean; order: Order }>('/admin/orders/payment', {
        method: 'PATCH',
        body: JSON.stringify({ id, paymentStatus }),
      });
    },
    async getAdminLiveUpdates() {
      return request<{
        success: boolean;
        data: {
          recentOrders: Order[];
          unreadCount: number;
          pendingOrdersCount: number;
          timestamp: string;
        };
      }>('/admin/live-updates', { cache: 'no-store' });
    },
  },

  // ── Notifications ──
  notifications: {
    async getUserList() {
      return request<{ success: boolean; notifications: NotificationItem[] }>('/notifications');
    },
    async getUserUnreadCount() {
      return request<{ success: boolean; unreadCount: number }>('/notifications/unread-count');
    },
    async markUserRead(id: string) {
      return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    async markUserReadAll() {
      return request<{ success: boolean }>('/notifications/read-all', { method: 'POST' });
    },
    async getAdminList() {
      return request<{ success: boolean; notifications: NotificationItem[] }>('/notifications/admin');
    },
    async getAdminUnreadCount() {
      return request<{ success: boolean; unreadCount: number }>('/notifications/admin/unread-count');
    },
    async markAdminRead(id: string) {
      return request<{ success: boolean }>(`/notifications/admin/${id}/read`, { method: 'PATCH' });
    },
    async markAdminReadAll() {
      return request<{ success: boolean }>('/notifications/admin/read-all', { method: 'POST' });
    },
  },

  // ── Tables Management ──
  tables: {
    async list() {
      return request<{
        success: boolean;
        tables: Array<{
          id: string;
          tableNumber: string;
          capacity: number;
          status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
          qrCodeToken?: string;
          activeSession: {
            id: string;
            waiterName: string;
            guestCount: number;
            openedAt: string;
            totalAmount: number;
            itemCount: number;
            ordersCount: number;
            billStatus: string;
          } | null;
        }>;
      }>('/tables', { cache: 'no-store' });
    },
    async create(data: { tableNumber: string; capacity: number }) {
      return request<{ success: boolean; table: any }>('/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async update(id: string, data: any) {
      return request<{ success: boolean; table: any }>(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async delete(id: string) {
      return request<{ success: boolean; message: string }>(`/tables/${id}`, {
        method: 'DELETE',
      });
    },
    async openSession(data: { tableId: string; waiterId?: string; guestCount?: number; notes?: string }) {
      return request<{ success: boolean; session: any }>('/tables/open-session', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ── POS Terminal ──
  pos: {
    async createOrder(data: {
      tableSessionId: string;
      notes?: string;
      items: Array<{
        productId?: string;
        productName: string;
        variantName?: string;
        selectedWeightInGrams?: number;
        unitPrice?: number;
        pricePerKg?: number;
        calculatedPrice: number;
        quantity: number;
        specialInstructions?: string;
      }>;
    }) {
      return request<{
        success: boolean;
        message: string;
        order: any;
        kotTicket: any;
      }>('/pos/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async getSessionDetails(sessionId: string) {
      return request<{ success: boolean; session: any }>(`/pos/sessions/${sessionId}`, {
        cache: 'no-store',
      });
    },
    async closeSession(sessionId: string) {
      return request<{ success: boolean; message: string }>(`/pos/sessions/${sessionId}/close`, {
        method: 'POST',
      });
    },
  },

  // ── Kitchen Display System (KDS) ──
  kitchen: {
    async getTickets() {
      return request<{
        success: boolean;
        tickets: Array<{
          id: string;
          ticketNumber: number;
          status: 'QUEUED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
          notes?: string;
          createdAt: string;
          tableSession?: {
            table?: { tableNumber: string };
            waiter?: { name: string };
          };
          order: {
            id: string;
            orderNumber: string;
            orderType: string;
            customerName: string;
          };
          items: Array<{
            id: string;
            itemName: string;
            itemDetails?: string;
            quantity: number;
            status: string;
          }>;
        }>;
      }>('/kitchen/tickets', { cache: 'no-store' });
    },
    async updateTicketStatus(id: string, status: string) {
      return request<{ success: boolean; ticket: any }>(`/kitchen/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    async updateItemStatus(itemId: string, status: string) {
      return request<{ success: boolean; item: any }>(`/kitchen/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // ── Billing & Settlements ──
  billing: {
    async generate(data: {
      tableSessionId?: string;
      orderId?: string;
      discountAmount?: number;
      taxAmount?: number;
      deliveryCharge?: number;
    }) {
      return request<{ success: boolean; bill: any }>('/billing/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async recordPayment(data: {
      billId: string;
      amount: number;
      method: 'CASH' | 'FONEPAY_QR' | 'ESEWA' | 'KHALTI' | 'CARD' | 'OTHER';
      transactionReference?: string;
      notes?: string;
    }) {
      return request<{
        success: boolean;
        message: string;
        payment: any;
        updatedBill: any;
        totalPaid: number;
        balanceRemaining: number;
      }>('/billing/pay', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async getDetails(id: string) {
      return request<{ success: boolean; bill: any }>(`/billing/${id}`, { cache: 'no-store' });
    },
    async list(params?: { status?: string; limit?: number; page?: number }) {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.page) qs.set('page', String(params.page));
      const q = qs.toString() ? `?${qs.toString()}` : '';
      return request<{
        success: boolean;
        bills: any[];
        totalCount: number;
        page: number;
        totalPages: number;
      }>(`/billing${q}`, { cache: 'no-store' });
    },
  },

  // ── Sales & Reports ──
  reports: {
    async getDailySummary() {
      return request<{
        success: boolean;
        summary: {
          totalRevenueToday: number;
          totalOrdersToday: number;
          dineInOrders: number;
          deliveryOrders: number;
          dineInRevenue: number;
          deliveryRevenue: number;
          paymentBreakdown: Record<string, number>;
          topItems: Array<{ name: string; count: number; revenue: number }>;
          totalTables: number;
          occupiedTables: number;
          availableTables: number;
          activeKotsCount: number;
        };
      }>('/reports/summary', { cache: 'no-store' });
    },
    async getSalesAnalytics(days = 7) {
      return request<{
        success: boolean;
        chartData: Array<{ date: string; revenue: number; transactions: number }>;
      }>(`/reports/analytics?days=${days}`, { cache: 'no-store' });
    },
  },

  // ── Store Operational Status & Admin Overrides ──
  store: {
    async getStatus() {
      return request<{
        success: boolean;
        isOpen: boolean;
        mode: 'AUTO' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';
        isFirstTuesday: boolean;
        isOutsideHours: boolean;
        statusText: string;
        badgeLabel: string;
        reason: string;
        nextOpening: string;
        nepalTimeFormatted: string;
        updatedAt?: string;
      }>('/store-status', { cache: 'no-store' });
    },
    async getAdminStatus() {
      return request<{
        success: boolean;
        isOpen: boolean;
        mode: 'AUTO' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';
        isFirstTuesday: boolean;
        isOutsideHours: boolean;
        statusText: string;
        badgeLabel: string;
        reason: string;
        nextOpening: string;
        nepalTimeFormatted: string;
        updatedAt?: string;
      }>('/admin/store-status', { cache: 'no-store' });
    },
    async updateStatus(data: { mode: 'AUTO' | 'MANUAL_OPEN' | 'MANUAL_CLOSED'; customReason?: string }) {
      return request<{
        success: boolean;
        message: string;
        isOpen: boolean;
        mode: 'AUTO' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';
        statusText: string;
        badgeLabel: string;
        reason: string;
        nextOpening: string;
      }>('/admin/store-status', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // ── Push Subscriptions ──
  push: {
    async subscribe(subscription: any, type: 'customer' | 'admin' = 'customer') {
      return request<{ success: boolean }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription, type }),
      });
    },
    async unsubscribe(endpoint: string) {
      return request<{ success: boolean }>('/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
      });
    },
    async getVapidPublicKey() {
      return request<{ publicKey: string }>('/push/vapid-public-key');
    },
  },
};

export default api;

