export interface OtpRecord {
  otp: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  expiresAt: number;
}

const otpMap = new Map<string, OtpRecord>();

// Clean up expired OTPs periodically every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpMap.entries()) {
    if (value.expiresAt <= now) {
      otpMap.delete(key);
    }
  }
}, 2 * 60 * 1000);

export function saveOtp(data: {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  otp: string;
  ttlMinutes?: number;
}): void {
  const emailKey = data.email.toLowerCase();
  const ttl = (data.ttlMinutes || 5) * 60 * 1000;
  otpMap.set(emailKey, {
    name: data.name,
    email: emailKey,
    phone: data.phone || null,
    passwordHash: data.passwordHash,
    otp: data.otp,
    expiresAt: Date.now() + ttl,
  });
}

export function getOtp(email: string): OtpRecord | null {
  const emailKey = email.toLowerCase();
  const record = otpMap.get(emailKey);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    otpMap.delete(emailKey);
    return null;
  }
  return record;
}

export function deleteOtp(email: string): void {
  otpMap.delete(email.toLowerCase());
}
