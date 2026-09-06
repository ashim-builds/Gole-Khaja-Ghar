import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[];
  category: string;
  priceType: 'weight' | 'variant';
  pricePerKg?: number;
  weightOptions?: { value: number; unit: string }[];
  allowCustomWeight?: boolean;
  variants?: { name: string; price: number }[];
  available: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    images: [{ type: String }],
    category: { type: String, required: true },
    priceType: { type: String, enum: ['weight', 'variant'], default: 'weight' },
    pricePerKg: { type: Number },
    weightOptions: [
      {
        value: { type: Number, required: true },
        unit: { type: String, required: true, default: 'g' },
      },
    ],
    allowCustomWeight: { type: Boolean, default: true },
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
