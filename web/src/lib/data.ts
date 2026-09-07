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

export async function getCategories(): Promise<string[]> {
  try {
    const res = await api.products.getCategories();
    return res.categories || ["Khaja Sets", "Momo", "Chowmein", "Sekuwa & Snacks", "Beverages", "Other"];
  } catch (error) {
    console.error('getCategories failed:', error);
    return ["Khaja Sets", "Momo", "Chowmein", "Sekuwa & Snacks", "Beverages", "Other"];
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
