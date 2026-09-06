import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProduct } from './Product';

export interface IOrderItem {
  product: mongoose.Types.ObjectId | IProduct;
  productName: string;
  qty: number;
  priceType: 'weight' | 'variant';
  selectedWeightInGrams?: number;
  pricePerKgAtTimeOfOrder?: number;
  selectedVariantName?: string;
  unitPriceAtTimeOfOrder?: number;
  calculatedPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: mongoose.Types.ObjectId;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  items: IOrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  orderType: 'pickup' | 'delivery';
  paymentMethod: 'cod' | 'qr';
  paymentStatus: 'pending' | 'paid';
  address?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    priceType: { type: String, enum: ['weight', 'variant'], required: true },
    selectedWeightInGrams: { type: Number },
    pricePerKgAtTimeOfOrder: { type: Number },
    selectedVariantName: { type: String },
    unitPriceAtTimeOfOrder: { type: Number },
    calculatedPrice: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 0 },
    orderType: { type: String, enum: ['pickup', 'delivery'], required: true },
    paymentMethod: { type: String, enum: ['cod', 'qr'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    address: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
