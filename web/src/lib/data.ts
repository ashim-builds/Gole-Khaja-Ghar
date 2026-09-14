import { api, Product } from './api';

export type { Product };

export async function getProducts(
  category?: string,
  query?: string,
  page?: number,
  limit?: number
): Promise<{ products: Product[]; total: number; totalPages: number; page: number }> {
  try {
    const res = await api.products.getAll(category, query, false, page, limit);
    return {
      products: res.products || [],
      total: res.pagination?.total ?? (res.products || []).length,
      totalPages: res.pagination?.totalPages ?? 1,
      page: res.pagination?.page ?? 1,
    };
  } catch (error) {
    console.error('getProducts failed:', error);
    return { products: [], total: 0, totalPages: 1, page: 1 };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await api.products.getBySlug(slug);
    return res.product || null;
  } catch (error) {
    console.error('getProductBySlug failed:', error);
    return null;
  }
}

let cachedCategories: string[] | null = null;
let lastCatFetch = 0;
const CAT_CACHE_TTL = 5 * 60 * 1000; // 5 mins in-memory cache

export async function getCategories(): Promise<string[]> {
  const now = Date.now();
  if (cachedCategories && now - lastCatFetch < CAT_CACHE_TTL) {
    return cachedCategories;
  }
  try {
    const res = await api.products.getCategories();
    if (res.categories && res.categories.length > 0) {
      cachedCategories = res.categories;
      lastCatFetch = now;
      return cachedCategories;
    }
    return ["Khaja Sets", "Momo", "Chowmein", "Sekuwa & Snacks", "Beverages", "Other"];
  } catch (error) {
    console.error('getCategories failed:', error);
    return cachedCategories || ["Khaja Sets", "Momo", "Chowmein", "Sekuwa & Snacks", "Beverages", "Other"];
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await api.products.getFeatured();
    return res.products || [];
  } catch (error) {
    console.error('getFeaturedProducts failed:', error);
    return [];
  }
}
