import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
  userId?: string;
  type: 'customer' | 'admin';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, index: true },
    type: { type: String, enum: ['customer', 'admin'], required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const PushSubscriptionModel: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscriptionModel;
