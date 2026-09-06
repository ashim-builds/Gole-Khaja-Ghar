export interface Product {
  id: string;
  slug: string;
  name: string;
  priceType: 'weight' | 'variant';
  pricePerKg?: number;
  variants?: { name: string; price: number }[];
  weightOptions?: { value: number; unit: string }[];
  allowCustomWeight?: boolean;
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

function getBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return '/api';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

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
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // ── Authentication ──
  auth: {
    async register(data: { name: string; email: string; phone?: string; password: string }) {
      return request<{ success: boolean; user: UserProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async login(data: { email: string; password: string }) {
      return request<{ success: boolean; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async getMe() {
      return request<{ success: boolean; user: UserProfile }>('/auth/me');
    },
    async logout() {
      return request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    },
    async adminLogin(password: string) {
      return request<{ success: boolean }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },
    async adminLogout() {
      return request<{ success: boolean }>('/auth/admin/logout', { method: 'POST' });
    },
  },

  // ── Products & Catalog ──
  products: {
    async getAll(category?: string, query?: string, availableOnly?: boolean) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (query) params.set('query', query);
      if (availableOnly) params.set('availableOnly', 'true');
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; products: Product[] }>(`/products${qs}`, {
        cache: 'no-store',
      });
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

  // ── Push Subscriptions ──
  push: {
    async subscribe(subscription: any, type: 'customer' | 'admin' = 'customer') {
      return request<{ success: boolean }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription, type }),
      });
    },
  },
};
