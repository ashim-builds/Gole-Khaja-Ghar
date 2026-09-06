import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserCartItem {
  cartItemId: string;
  product: {
    id: string;
    slug: string;
    name: string;
    image: string;
    priceType: 'weight' | 'variant';
    pricePerKg?: number;
  };
  qty: number;
  weightInGrams?: number;
  variantName?: string;
  variantPrice?: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  googleId?: string;
  role?: string;
  cart: IUserCartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<IUserCartItem>(
  {
    cartItemId: { type: String, required: true },
    product: {
      id: { type: String, required: true },
      slug: { type: String, required: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      priceType: { type: String, enum: ['weight', 'variant'], required: true },
      pricePerKg: { type: Number },
    },
    qty: { type: Number, required: true, default: 1 },
    weightInGrams: { type: Number },
    variantName: { type: String },
    variantPrice: { type: Number },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    passwordHash: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ['customer', 'waiter', 'kitchen', 'admin'], default: 'customer' },
    cart: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
