import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientType: 'USER' | 'ADMIN';
  recipientId: string;
  type:
    | 'ORDER_PLACED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_PREPARING'
    | 'ORDER_READY'
    | 'ORDER_COMPLETED'
    | 'ORDER_CANCELLED'
    | 'NEW_ORDER'
    | 'ORDER_CANCELLED_BY_USER';
  title: string;
  message: string;
  orderId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipientType: {
      type: String,
      required: true,
      enum: ['USER', 'ADMIN'],
    },
    recipientId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'ORDER_PLACED',
        'ORDER_CONFIRMED',
        'ORDER_PREPARING',
        'ORDER_READY',
        'ORDER_COMPLETED',
        'ORDER_CANCELLED',
        'NEW_ORDER',
        'ORDER_CANCELLED_BY_USER',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: false }
);

NotificationSchema.index({ recipientId: 1, recipientType: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipientType: 1, read: 1, createdAt: -1 });

const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
