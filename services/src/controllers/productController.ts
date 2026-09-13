import { emitProductUpdated } from '../lib/socket.js';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

async function saveUploadBuffer(buffer: Buffer, originalname: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(originalname) || '.jpg';
  const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(uploadsDir, randomName);

  await fs.writeFile(filePath, buffer);
  return `/uploads/${randomName}`;
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

function mapProduct(doc: any) {
  const isWeightBased = doc.priceType === 'WEIGHT' || doc.variants?.some((v: any) => 
    v.name.toLowerCase().includes('kg') || 
    v.name.toLowerCase().includes('gram') ||
    v.name.toLowerCase() === 'per kg'
  ) || false;
  const primaryPrice = doc.pricePerKg ? Number(doc.pricePerKg) : (doc.variants && doc.variants.length > 0 ? Number(doc.variants[0].price) : 0);

  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    priceType: isWeightBased ? 'weight' : 'variant',
    pricePerKg: primaryPrice,
    variants: (doc.variants || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      isAvailable: v.isAvailable,
    })),
    weightOptions: [
      { value: 250, unit: "g" },
      { value: 500, unit: "g" },
      { value: 1000, unit: "g" },
    ],
    allowCustomWeight: doc.allowCustomWeight !== undefined ? doc.allowCustomWeight : true,
    trackStock: doc.trackStock ?? false,
    stockQuantity: doc.stockQuantity ?? 0,
    lowStockAlert: doc.lowStockAlert ?? 5,
    category: doc.category?.name || 'Khaja Sets',
    categoryId: doc.categoryId,
    image: doc.image || '/images/logo.png',
    images: (doc.galleryImages as string[]) || [],
    description: doc.description || '',
    isAvailable: doc.isAvailable !== undefined ? doc.isAvailable : true,
    isFeatured: doc.isFeatured || false,
  };
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, query, availableOnly, page, limit } = req.query;
    const where: any = {};

    if (category && typeof category === 'string') {
      const cleanCategory = category.trim();
      if (cleanCategory) {
        where.category = {
          name: cleanCategory,
        };
      }
    }

    if (query && typeof query === 'string') {
      const cleanQuery = query.trim().slice(0, 100);
      if (cleanQuery) {
        where.OR = [
          { name: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
        ];
      }
    }

    if (availableOnly === 'true') {
      where.isAvailable = true;
    }

    const pageNum = page ? Math.max(1, parseInt(page as string, 10) || 1) : undefined;
    const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10) || 12)) : undefined;
    const skip = pageNum && limitNum ? (pageNum - 1) * limitNum : undefined;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
        },
        orderBy: [ { category: { sortOrder: 'asc' } }, { createdAt: 'asc' } ],
        ...(skip !== undefined ? { skip } : {}),
        ...(limitNum !== undefined ? { take: limitNum } : {}),
      }),
    ]);

    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');

    res.json({
      success: true,
      products: products.map(mapProduct),
      pagination: {
        total,
        page: pageNum || 1,
        limit: limitNum || total,
        totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
        hasMore: limitNum && pageNum ? pageNum * limitNum < total : false,
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = (req.params.slug || '').trim().slice(0, 100);
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }

    const doc = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, product: mapProduct(doc) });
  } catch (error) {
    console.error('getProductBySlug error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (!categories || categories.length === 0) {
      res.json({
        success: true,
        categories: ['Khaja Sets', 'Momo', 'Chowmein', 'Sekuwa & Snacks', 'Beverages'],
      });
      return;
    }

    res.json({ success: true, categories: categories.map((c) => c.name) });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function getFeaturedProducts(_req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isAvailable: true },
      include: {
        category: true,
        variants: true,
      },
      orderBy: [ { category: { sortOrder: 'asc' } }, { createdAt: 'asc' } ],
    });

    res.json({ success: true, products: products.map(mapProduct) });
  } catch (error) {
    console.error('getFeaturedProducts error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
}

async function findOrCreateCategory(categoryName: string): Promise<{ id: string; name: string }> {
  const cleanName = (categoryName || 'Khaja Sets').trim();
  const categorySlug = slugify(cleanName) || 'category';

  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { name: cleanName },
        { slug: categorySlug },
      ],
    },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: cleanName,
        slug: categorySlug,
      },
    });
  }

  return category;
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const name = (req.body.name as string)?.trim().slice(0, 100);
    const rawSlug = (req.body.slug as string)?.trim().slice(0, 100);
    const slug = rawSlug || slugify(name);
    const description = (req.body.description as string)?.trim().slice(0, 1000);
    const categoryName = (req.body.category as string)?.trim().slice(0, 50) || 'Khaja Sets';
    const priceType = (req.body.priceType as string) || 'weight';

    if (!name || !slug) {
      res.status(400).json({ error: 'Product name and slug are required' });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: 'A product with this slug already exists' });
      return;
    }

    // Ensure category exists
    const category = await findOrCreateCategory(categoryName);

    let variants: { name: string; price: number }[] = [];

    if (priceType === 'weight') {
      const pricePerKg = Number(req.body.pricePerKg);
      if (isNaN(pricePerKg) || pricePerKg < 0) {
        res.status(400).json({ error: 'Invalid price per Kg' });
        return;
      }
      variants = [{ name: 'Per Kg', price: pricePerKg }];
    } else {
      try {
        variants = JSON.parse(req.body.variants || '[]');
      } catch {
        variants = [];
      }
    }

    let imageUrl = (req.body.existingImage as string) || '/images/logo.png';
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.imageFile?.[0]) {
      const file = files.imageFile[0];
      if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        res.status(400).json({ error: 'Only JPG, PNG, and WebP images are allowed' });
        return;
      }
      imageUrl = await saveUploadBuffer(file.buffer, file.originalname);
    }

    let existingGallery: string[] = [];
    try {
      existingGallery = JSON.parse(req.body.existingImages || '[]');
    } catch {
      existingGallery = [];
    }

    const uploadedGallery: string[] = [];
    if (files?.galleryFiles) {
      for (const file of files.galleryFiles) {
        if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          const url = await saveUploadBuffer(file.buffer, file.originalname);
          uploadedGallery.push(url);
        }
      }
    }

    const images = [...existingGallery, ...uploadedGallery];
    const isAvailable = req.body.isAvailable !== 'false' && req.body.available !== 'false';
    const isFeatured = req.body.isFeatured === 'true' || req.body.featured === 'true';
    const priceTypeEnum = priceType === 'weight' ? 'WEIGHT' : 'VARIANT';
    const pricePerKgVal = priceType === 'weight' ? Number(req.body.pricePerKg) || null : null;
    const allowCustomWeightVal = req.body.allowCustomWeight === 'true' || req.body.allowCustomWeight === true;
    const trackStock = req.body.trackStock === 'true' || req.body.trackStock === true;
    const stockQuantity = req.body.stockQuantity !== undefined ? Math.max(0, parseInt(req.body.stockQuantity, 10) || 0) : 0;
    const lowStockAlert = req.body.lowStockAlert !== undefined ? Math.max(0, parseInt(req.body.lowStockAlert, 10) || 5) : 5;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        category: { connect: { id: category.id } },
        image: imageUrl,
        galleryImages: images,
        priceType: priceTypeEnum,
        pricePerKg: pricePerKgVal,
        allowCustomWeight: allowCustomWeightVal,
        trackStock,
        stockQuantity,
        lowStockAlert,
        isAvailable,
        isFeatured,
        variants: {
          create: variants.map((v) => ({
            name: v.name,
            price: Number(v.price),
            isAvailable: true,
          })),
        },
      },
      include: {
        category: true,
        variants: true,
      },
    });

    const mapped = mapProduct(product); emitProductUpdated(mapped); res.status(201).json({ success: true, product: mapped });
  } catch (error: any) {
    console.error('createProduct error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create product' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const name = (req.body.name as string)?.trim().slice(0, 100);
    const rawSlug = (req.body.slug as string)?.trim().slice(0, 100);
    const slug = rawSlug || slugify(name);
    const description = (req.body.description as string)?.trim().slice(0, 1000);
    const categoryName = (req.body.category as string)?.trim().slice(0, 50) || 'Khaja Sets';
    const priceType = (req.body.priceType as string) || 'weight';

    if (!name || !slug) {
      res.status(400).json({ error: 'Product name and slug are required' });
      return;
    }

    // Ensure category exists
    const category = await findOrCreateCategory(categoryName);

    let variants: { name: string; price: number }[] = [];

    if (priceType === 'weight') {
      const pricePerKg = Number(req.body.pricePerKg);
      if (isNaN(pricePerKg) || pricePerKg < 0) {
        res.status(400).json({ error: 'Invalid price per Kg' });
        return;
      }
      variants = [{ name: 'Per Kg', price: pricePerKg }];
    } else {
      try {
        variants = JSON.parse(req.body.variants || '[]');
      } catch {
        variants = [];
      }
    }

    let imageUrl = (req.body.existingImage as string) || '';
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.imageFile?.[0]) {
      const file = files.imageFile[0];
      if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        res.status(400).json({ error: 'Only JPG, PNG, and WebP images are allowed' });
        return;
      }
      imageUrl = await saveUploadBuffer(file.buffer, file.originalname);
    }

    let existingGallery: string[] = [];
    try {
      existingGallery = JSON.parse(req.body.existingImages || '[]');
    } catch {
      existingGallery = [];
    }

    const uploadedGallery: string[] = [];
    if (files?.galleryFiles) {
      for (const file of files.galleryFiles) {
        if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          const url = await saveUploadBuffer(file.buffer, file.originalname);
          uploadedGallery.push(url);
        }
      }
    }

    const images = [...existingGallery, ...uploadedGallery];
    const isAvailable = req.body.isAvailable !== 'false' && req.body.available !== 'false';
    const isFeatured = req.body.isFeatured === 'true' || req.body.featured === 'true';
    const priceTypeEnum = priceType === 'weight' ? 'WEIGHT' : 'VARIANT';
    const pricePerKgVal = priceType === 'weight' ? Number(req.body.pricePerKg) || null : null;
    const allowCustomWeightVal = req.body.allowCustomWeight === 'true' || req.body.allowCustomWeight === true;
    const trackStock = req.body.trackStock !== undefined ? (req.body.trackStock === 'true' || req.body.trackStock === true) : undefined;
    const stockQuantity = req.body.stockQuantity !== undefined ? Math.max(0, parseInt(req.body.stockQuantity, 10) || 0) : undefined;
    const lowStockAlert = req.body.lowStockAlert !== undefined ? Math.max(0, parseInt(req.body.lowStockAlert, 10) || 5) : undefined;

    // Update variants
    if (variants.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        category: { connect: { id: category.id } },
        priceType: priceTypeEnum,
        pricePerKg: pricePerKgVal,
        allowCustomWeight: allowCustomWeightVal,
        ...(trackStock !== undefined ? { trackStock } : {}),
        ...(stockQuantity !== undefined ? { stockQuantity } : {}),
        ...(lowStockAlert !== undefined ? { lowStockAlert } : {}),
        ...(imageUrl ? { image: imageUrl } : {}),
        galleryImages: images,
        isAvailable,
        isFeatured,
        ...(variants.length > 0
          ? {
              variants: {
                create: variants.map((v) => ({
                  name: v.name,
                  price: Number(v.price),
                  isAvailable: true,
                })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        variants: true,
      },
    });

    const mapped = mapProduct(updated); emitProductUpdated(mapped); res.json({ success: true, product: mapped });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    emitProductUpdated({ id, deleted: true });
    res.json({ success: true });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

export async function toggleProductStock(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { available } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable: Boolean(available) },
      include: {
        category: true,
        variants: true,
      },
    });

    res.json({ success: true, product: mapProduct(updated) });
  } catch (error) {
    console.error('toggleProductStock error:', error);
    res.status(500).json({ error: 'Failed to toggle product stock' });
  }
}

export async function adjustProductStock(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body; // action: 'add' | 'reduce' | 'set'
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let newStock = product.stockQuantity;
    if (action === 'add') {
      newStock += qty;
    } else if (action === 'reduce') {
      newStock = Math.max(0, newStock - qty);
    } else if (action === 'set') {
      newStock = qty;
    } else {
      res.status(400).json({ error: 'Invalid action. Must be add, reduce, or set' });
      return;
    }

    // Automatically keep available if stock > 0, or mark out of stock if stock is 0
    const isAvailable = newStock > 0 ? (product.isAvailable !== false) : false;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        trackStock: true,
        stockQuantity: newStock,
        isAvailable,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    const mapped = mapProduct(updated); emitProductUpdated(mapped); res.json({ success: true, product: mapped, newStock });
  } catch (error: any) {
    console.error('adjustProductStock error:', error);
    res.status(500).json({ error: error?.message || 'Failed to adjust product stock' });
  }
}

