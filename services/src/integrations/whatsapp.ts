const FONNTE_API = 'https://api.fonnte.com/send';

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN || process.env.FONNTE_API_TOKEN;
  if (!token || token === 'YOUR_FONNTE_TOKEN_HERE') {
    return;
  }

  const normalised = phone.replace(/^\+/, '').replace(/\s/g, '');

  try {
    const res = await fetch(FONNTE_API, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: normalised,
        message,
        countryCode: '977',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[WhatsApp] Fonnte error ${res.status}:`, text);
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to send:', err);
  }
}

export async function notifyAdminNewOrder(
  orderNumber: string,
  customerName: string,
  amount: number,
  orderType: string
) {
  const phone = process.env.WHATSAPP_ADMIN_NUMBER || process.env.ADMIN_WHATSAPP_PHONE;
  if (!phone) return;

  const message =
    `🛎 *New Order — ${orderNumber}*\n\n` +
    `👤 Customer: ${customerName}\n` +
    `💰 Amount: Rs. ${amount.toFixed(2)}\n` +
    `📦 Type: ${orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}\n\n` +
    `Open admin panel to confirm the order.`;

  await sendWhatsApp(phone, message);
}

export async function notifyCustomerStatusChange(
  phone: string,
  customerName: string,
  orderNumber: string,
  status: string,
  orderUrl: string
) {
  const statusMessages: Record<string, string> = {
    confirmed: `✅ *Order Confirmed!*\n\nHi ${customerName}! Your order *${orderNumber}* has been confirmed. We're getting it ready for you!`,
    preparing: `👨‍🍳 *Order Being Prepared*\n\nHi ${customerName}! Your order *${orderNumber}* is now being prepared. Hang tight!`,
    ready: `🎉 *Order Ready!*\n\nHi ${customerName}! Your order *${orderNumber}* is ready for ${orderUrl.includes('delivery') ? 'delivery' : 'pickup'}!`,
    delivered: `✅ *Order Delivered!*\n\nHi ${customerName}! Your order *${orderNumber}* has been delivered. Thank you for ordering from Golu Khaja Ghar! 🍲`,
    cancelled: `❌ *Order Cancelled*\n\nHi ${customerName}! Your order *${orderNumber}* has been cancelled. Contact us if you have questions.`,
  };

  const message =
    statusMessages[status] ?? `📦 Order *${orderNumber}* status updated to: *${status}*`;
  await sendWhatsApp(phone, message + `\n\nTrack your order: ${orderUrl}`);
}

export async function notifyCustomerPaymentConfirmed(
  phone: string,
  customerName: string,
  orderNumber: string
) {
  const message =
    `💳 *Payment Confirmed!*\n\n` +
    `Hi ${customerName}! We've received your payment for order *${orderNumber}*. ` +
    `We're now preparing your delicious food. Thank you for ordering from Golu Khaja Ghar! 🍲`;
  await sendWhatsApp(phone, message);
}
