import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ProductModel from '../models/Product.js';
import { escapeRegex } from '../validators/schemas.js';
import cloudinary from '../config/cloudinary.js';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function uploadBufferToCloudinary(buffer: Buffer, originalname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'crispychips',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message || 'Image upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(buffer);
  });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, query, availableOnly } = req.query;
    const filter: any = {};

    if (category && typeof category === 'string') {
      const cleanCategory = category.trim().slice(0, 50);
      if (cleanCategory) {
        filter.category = cleanCategory;
      }
    }

    if (query && typeof query === 'string') {
      const cleanQuery = escapeRegex(query.trim().slice(0, 100));
      if (cleanQuery) {
        filter.$or = [
          { name: { $regex: cleanQuery, $options: 'i' } },
          { description: { $regex: cleanQuery, $options: 'i' } },
        ];
      }
    }

    if (availableOnly === 'true') {
      filter.available = true;
    }

    const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();
    
    const mapped = products.map((doc: any) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      priceType: doc.priceType || 'weight',
      pricePerKg: doc.pricePerKg,
      variants: doc.variants || [],
      weightOptions: doc.weightOptions || [],
      allowCustomWeight: doc.allowCustomWeight !== undefined ? doc.allowCustomWeight : true,
      category: doc.category,
      image: doc.image || '/images/snack_bowl.jpg',
      images: doc.images || [],
      description: doc.description || '',
      isAvailable: doc.available !== undefined ? doc.available : true,
      isFeatured: doc.featured || false,
    }));

    res.json({ success: true, products: mapped });
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

    const doc: any = await ProductModel.findOne({ slug }).lean();
    if (!doc) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = {
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      priceType: doc.priceType || 'weight',
      pricePerKg: doc.pricePerKg,
      variants: doc.variants || [],
      weightOptions: doc.weightOptions || [],
      allowCustomWeight: doc.allowCustomWeight !== undefined ? doc.allowCustomWeight : true,
      category: doc.category,
      image: doc.image || '/images/snack_bowl.jpg',
      images: doc.images || [],
      description: doc.description || '',
      isAvailable: doc.available !== undefined ? doc.available : true,
      isFeatured: doc.featured || false,
    };

    res.json({ success: true, product });
  } catch (error) {
    console.error('getProductBySlug error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await ProductModel.distinct('category');
    if (!categories || categories.length === 0) {
      res.json({
        success: true,
        categories: ['Khaja Sets', 'Momo', 'Chowmein', 'Sekuwa & Snacks', 'Beverages', 'Other'],
      });
      return;
    }
    res.json({ success: true, categories });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function getFeaturedProducts(_req: Request, res: Response): Promise<void> {
  try {
    const products = await ProductModel.find({ featured: true }).lean();
    const mapped = products.map((doc: any) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      priceType: doc.priceType || 'weight',
      pricePerKg: doc.pricePerKg,
      variants: doc.variants || [],
      weightOptions: doc.weightOptions || [],
      allowCustomWeight: doc.allowCustomWeight !== undefined ? doc.allowCustomWeight : true,
      category: doc.category,
      image: doc.image || '/images/snack_bowl.jpg',
      images: doc.images || [],
      description: doc.description || '',
      isAvailable: doc.available !== undefined ? doc.available : true,
      isFeatured: doc.featured || false,
    }));

    res.json({ success: true, products: mapped });
  } catch (error) {
    console.error('getFeaturedProducts error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const name = (req.body.name as string)?.trim().slice(0, 100);
    const slug = (req.body.slug as string)?.trim().slice(0, 100);
    const description = (req.body.description as string)?.trim().slice(0, 1000);
    const category = (req.body.category as string)?.trim().slice(0, 50);
    const priceType = (req.body.priceType as 'weight' | 'variant') || 'weight';

    if (!name || !slug || !category) {
      res.status(400).json({ error: 'Product name, slug, and category are required' });
      return;
    }

    const existing = await ProductModel.findOne({ slug });
    if (existing) {
      res.status(400).json({ error: 'A product with this slug already exists' });
      return;
    }

    let pricePerKg: number | undefined;
    let variants: any[] = [];
    let weightOptions: any[] = [];

    if (priceType === 'weight') {
      pricePerKg = Number(req.body.pricePerKg);
      if (isNaN(pricePerKg) || pricePerKg < 0) {
        res.status(400).json({ error: 'Invalid price per Kg' });
        return;
      }
      try {
        weightOptions = JSON.parse(req.body.weightOptions || '[]');
      } catch {
        weightOptions = [];
      }
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
      imageUrl = await uploadBufferToCloudinary(file.buffer, file.originalname);
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
          const url = await uploadBufferToCloudinary(file.buffer, file.originalname);
          uploadedGallery.push(url);
        }
      }
    }

    const images = [...existingGallery, ...uploadedGallery];
    const available = req.body.isAvailable === 'true' || req.body.available === 'true';
    const featured = req.body.isFeatured === 'true' || req.body.featured === 'true';
    const allowCustomWeight = req.body.allowCustomWeight !== 'false';

    const product = await ProductModel.create({
      name,
      slug,
      description,
      category,
      priceType,
      pricePerKg,
      weightOptions,
      allowCustomWeight,
      variants,
      image: imageUrl,
      images,
      available,
      featured,
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error('createProduct error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create product' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const name = (req.body.name as string)?.trim().slice(0, 100);
    const slug = (req.body.slug as string)?.trim().slice(0, 100);
    const description = (req.body.description as string)?.trim().slice(0, 1000);
    const category = (req.body.category as string)?.trim().slice(0, 50);
    const priceType = (req.body.priceType as 'weight' | 'variant') || 'weight';

    if (!name || !slug || !category) {
      res.status(400).json({ error: 'Product name, slug, and category are required' });
      return;
    }

    let pricePerKg: number | undefined;
    let variants: any[] = [];
    let weightOptions: any[] = [];

    if (priceType === 'weight') {
      pricePerKg = Number(req.body.pricePerKg);
      if (isNaN(pricePerKg) || pricePerKg < 0) {
        res.status(400).json({ error: 'Invalid price per Kg' });
        return;
      }
      try {
        weightOptions = JSON.parse(req.body.weightOptions || '[]');
      } catch {
        weightOptions = [];
      }
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
      imageUrl = await uploadBufferToCloudinary(file.buffer, file.originalname);
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
          const url = await uploadBufferToCloudinary(file.buffer, file.originalname);
          uploadedGallery.push(url);
        }
      }
    }

    const images = [...existingGallery, ...uploadedGallery];
    const available = req.body.isAvailable === 'true' || req.body.available === 'true';
    const featured = req.body.isFeatured === 'true' || req.body.featured === 'true';
    const allowCustomWeight = req.body.allowCustomWeight !== 'false';

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        category,
        priceType,
        pricePerKg,
        weightOptions,
        allowCustomWeight,
        variants,
        image: imageUrl,
        images,
        available,
        featured,
      },
      { new: true }
    );

    res.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    await ProductModel.findByIdAndDelete(id);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { available: Boolean(available) },
      { new: true }
    );

    res.json({ success: true, product: updated });
  } catch (error) {
    console.error('toggleProductStock error:', error);
    res.status(500).json({ error: 'Failed to toggle product stock' });
  }
}
