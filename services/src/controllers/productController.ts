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
  const isWeightBased = doc.variants?.some((v: any) => v.name.includes('kg') || v.name.includes('g')) || false;
  const primaryPrice = doc.variants && doc.variants.length > 0 ? Number(doc.variants[0].price) : 0;

  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    priceType: isWeightBased ? 'weight' : (doc.variants?.length > 1 ? 'variant' : 'weight'),
    pricePerKg: primaryPrice,
    variants: (doc.variants || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      isAvailable: v.isAvailable,
    })),
    weightOptions: [250, 500, 1000],
    allowCustomWeight: true,
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
    const { category, query, availableOnly } = req.query;
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

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, products: products.map(mapProduct) });
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, products: products.map(mapProduct) });
  } catch (error) {
    console.error('getFeaturedProducts error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
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
    const categorySlug = slugify(categoryName);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: categoryName },
      create: { name: categoryName, slug: categorySlug },
    });

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

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId: category.id,
        image: imageUrl,
        galleryImages: images,
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

    res.status(201).json({ success: true, product: mapProduct(product) });
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

    const categorySlug = slugify(categoryName);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: categoryName },
      create: { name: categoryName, slug: categorySlug },
    });

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
        categoryId: category.id,
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

    res.json({ success: true, product: mapProduct(updated) });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
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
