import { api, Product } from './api';
import { getSessionCache, setSessionCache } from './clientCache';

export type { Product };

export interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
}

export function getCachedProducts(
  category?: string,
  query?: string,
  page = 1,
  limit = 12
): { data: ProductsResponse; isStale: boolean } | null {
  const cacheKey = `golu_catalog_${category || 'all'}_${query || ''}_p${page}_l${limit}`;
  return getSessionCache<ProductsResponse>(cacheKey, 3 * 60 * 1000); // 3 mins fresh
}

export async function getProducts(
  category?: string,
  query?: string,
  page?: number,
  limit?: number
): Promise<ProductsResponse> {
  const cacheKey = `golu_catalog_${category || 'all'}_${query || ''}_p${page || 1}_l${limit || 12}`;

  try {
    const res = await api.products.getAll(category, query, false, page, limit);
    const result: ProductsResponse = {
      products: res.products || [],
      total: res.pagination?.total ?? (res.products || []).length,
      totalPages: res.pagination?.totalPages ?? 1,
      page: res.pagination?.page ?? 1,
    };
    setSessionCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('getProducts failed:', error);
    // Return stale cache if available upon network failure
    const cached = getSessionCache<ProductsResponse>(cacheKey, 60 * 60 * 1000);
    if (cached) return cached.data;
    return { products: [], total: 0, totalPages: 1, page: 1 };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cacheKey = `golu_prod_${slug}`;
  const cached = getSessionCache<Product>(cacheKey, 5 * 60 * 1000);

  try {
    const res = await api.products.getBySlug(slug);
    if (res.product) {
      setSessionCache(cacheKey, res.product);
      return res.product;
    }
    return cached?.data || null;
  } catch (error) {
    console.error('getProductBySlug failed:', error);
    return cached?.data || null;
  }
}

export async function getCategories(): Promise<string[]> {
  const cacheKey = 'golu_categories';
  const cached = getSessionCache<string[]>(cacheKey, 10 * 60 * 1000);

  // If we already have cached categories in session, return immediately
  if (cached && !cached.isStale) {
    return cached.data;
  }

  try {
    const res = await api.products.getCategories();
    if (res.categories && res.categories.length > 0) {
      setSessionCache(cacheKey, res.categories);
      return res.categories;
    }
  } catch (error) {
    console.error('getCategories failed:', error);
  }

  if (cached) return cached.data;

  return [
    'Morning Breakfast',
    'Soft Drinks',
    'Veg Items',
    'Khaja Non-Veg',
    'Snacks',
    'Beer & Hard Drinks',
  ];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const cacheKey = 'golu_featured_products';
  const cached = getSessionCache<Product[]>(cacheKey, 5 * 60 * 1000);

  try {
    const res = await api.products.getFeatured();
    if (res.products && res.products.length > 0) {
      setSessionCache(cacheKey, res.products);
      return res.products;
    }
    return cached?.data || [];
  } catch (error) {
    console.error('getFeaturedProducts failed:', error);
    return cached?.data || [];
  }
}
