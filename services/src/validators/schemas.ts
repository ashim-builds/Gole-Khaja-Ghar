import { z } from 'zod';

export const nameRegex = /^[a-zA-Z\s]{2,60}$/;
export const phoneRegex = /^9\d{9}$/;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be under 60 characters')
    .refine((val) => nameRegex.test(val), {
      message: 'Name can only contain letters and spaces (no numbers or symbols)',
    }),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(100, 'Email must be under 100 characters')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || phoneRegex.test(val.replace(/[\s\-]/g, '')), {
      message: 'Phone number must be exactly 10 digits and start with 9',
    }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be under 100 characters'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(100, 'Email must be under 100 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be under 100 characters'),
});

export const adminLoginSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be under 100 characters'),
});

export const orderItemSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required').max(100),
  qty: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Quantity cannot exceed 50 per item'),
  priceType: z.enum(['weight', 'variant']),
  weightInGrams: z
    .number()
    .min(1, 'Weight must be at least 1g')
    .max(20000, 'Weight cannot exceed 20kg per item')
    .optional(),
  variantName: z
    .string()
    .trim()
    .max(100, 'Variant name is too long')
    .optional(),
});

export const checkoutSchema = z
  .object({
    customerInfo: z.object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(60, 'Name must be under 60 characters')
        .refine((val) => nameRegex.test(val), {
          message: 'Name can only contain letters and spaces (no numbers or symbols)',
        }),
      phone: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .refine((val) => phoneRegex.test(val.replace(/[\s\-]/g, '')), {
          message: 'Phone number must be exactly 10 digits and start with 9 (e.g. 98XXXXXXXX)',
        }),
      email: z
        .string()
        .trim()
        .email('Please provide a valid email address')
        .max(100, 'Email is too long')
        .toLowerCase()
        .optional()
        .or(z.literal('')),
    }),
    orderType: z.enum(['pickup', 'delivery']),
    paymentMethod: z.enum(['cod', 'qr']).default('cod'),
    address: z
      .string()
      .trim()
      .max(250, 'Address must be under 250 characters')
      .transform((val) => val.replace(/[<>]/g, ''))
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .trim()
      .max(100, 'Notes cannot exceed 100 characters')
      .transform((val) => val.replace(/[<>]/g, ''))
      .optional()
      .or(z.literal('')),
    txRef: z
      .string()
      .trim()
      .max(100, 'Transaction reference is too long')
      .optional()
      .or(z.literal('')),
    items: z
      .array(orderItemSchema)
      .min(1, 'Your cart is empty')
      .max(50, 'Maximum of 50 distinct items allowed per order'),
  })
  .refine(
    (data) => {
      if (data.orderType === 'delivery') {
        if (!data.address || data.address.trim().length < 5) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Please enter a descriptive delivery address (at least 5 characters)',
      path: ['address'],
    }
  );

export const updateOrderStatusSchema = z.object({
  id: z.string().trim().min(1, 'Order ID is required').max(100),
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'cancelled',
  ]),
});

export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
