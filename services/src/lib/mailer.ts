import nodemailer from 'nodemailer';

let transporter: any = null;

export interface SendOtpEmailResult {
  success: boolean;
  simulated?: boolean;
  error?: string;
}

function getTransporter(): any {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = (process.env.SMTP_USER || 'ashim.sandbox@gmail.com').trim();
  const pass = (process.env.SMTP_PASS || 'cgydhteodxikdiud').replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!pass) {
    console.warn('⚠️ [EMAIL] SMTP_PASS not configured. Email delivery will be simulated in console.');
    return null;
  }

  const isGmail = host.includes('gmail') || user.includes('@gmail.com');

  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 25000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 25000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
      auth: user && pass ? {
        user,
        pass,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

export async function verifySmtp(): Promise<{ ok: boolean; error?: string; config?: any }> {
  try {
    const client = getTransporter();
    if (!client) {
      return {
        ok: false,
        error: 'SMTP_PASS is not configured in .env (running in simulated mode)',
        config: { simulated: true },
      };
    }
    await client.verify();
    return {
      ok: true,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '465',
        user: (process.env.SMTP_USER || 'ashim.sandbox@gmail.com').replace(/(.{3})(.*)(@.*)/, '$1***$3'),
        secure: process.env.SMTP_SECURE || 'true',
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '465',
        user: (process.env.SMTP_USER || 'ashim.sandbox@gmail.com').replace(/(.{3})(.*)(@.*)/, '$1***$3'),
      },
    };
  }
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<SendOtpEmailResult> {
  // Log OTP in server console for quick dev & debugging access
  console.log(`\n========================================`);
  console.log(`📨 [OTP EMAIL - GOLE KHAJA GHAR] To: ${to}`);
  console.log(`🔑 OTP CODE: [ ${otp} ]`);
  console.log(`========================================\n`);

  let mailClient: any = null;
  try {
    mailClient = getTransporter();
  } catch (err: any) {
    console.warn('⚠️ [EMAIL] Could not initialize transporter:', err?.message || err);
    mailClient = null;
  }

  if (!mailClient) {
    return { success: true, simulated: true };
  }

  const smtpUser = (process.env.SMTP_USER || 'ashim.sandbox@gmail.com').trim();
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const isGmail = host.includes('gmail') || smtpUser.includes('@gmail.com');

  // When using Gmail SMTP, From MUST match the authenticated account to avoid SPF/DMARC failure & spam routing
  let from = process.env.SMTP_FROM || `Gole Khaja Ghar <${smtpUser}>`;
  if (isGmail && smtpUser.includes('@gmail.com') && !from.includes(smtpUser)) {
    from = `Gole Khaja Ghar <${smtpUser}>`;
  }

  const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Your Verification Code: ${otp}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #ffffff; opacity: 0; mso-hide: all;">
    Your Gole Khaja Ghar verification code is: ${otp}. Valid for 5 minutes.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; width: 100%; margin: 0; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td align="center" style="background-color: #ea580c; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">🥟 Gole Khaja Ghar</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffedd5; font-weight: 600;">Fresh &amp; Authentic Nepali Khaja</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 28px; background-color: #ffffff; text-align: left;">
              <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                Namaste ${name || 'Customer'},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you for registering with Gole Khaja Ghar. Use the 6-digit verification code below to complete your email verification:
              </p>

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center" style="background-color: #fff7ed; border: 2px dashed #ea580c; border-radius: 14px; padding: 24px 16px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                      Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ea580c; line-height: 1.1; padding-left: 12px; margin: 4px 0 8px 0;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #9a3412;">
                      ⏱️ Valid for 5 minutes only
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                If you did not request this verification code, please ignore this email. Do not share this code with anyone.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              &copy; ${new Date().getFullYear()} Gole Khaja Ghar. Sisuwa, Pokhara-30, Nepal.<br />
              All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `Namaste ${name || 'Customer'},\n\nYour Gole Khaja Ghar verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share it with anyone.\n\nThank you,\nGole Khaja Ghar`;

  // 1. High-reliability HTTPS Dispatch: If RESEND_API_KEY is configured, send via HTTPS (Port 443).
  // Port 443 is NEVER blocked by cPanel firewalls (unlike port 465/587 which throw ECONNREFUSED).
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Gole Khaja Ghar <onboarding@resend.dev>',
          to: [to],
          subject: `Your Verification Code: ${otp} - Gole Khaja Ghar`,
          html: htmlContent,
          text: textContent,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`✅ [RESEND HTTPS] Successfully sent OTP email to ${to} (ID: ${data.id})`);
        return { success: true, simulated: false };
      }
      console.warn('⚠️ [RESEND HTTPS] Failed, falling back to SMTP:', data?.message || data);
    } catch (resendErr: any) {
      console.warn('⚠️ [RESEND HTTPS] Connection error, falling back to SMTP:', resendErr.message);
    }
  }

  try {
    await mailClient.sendMail({
      from,
      to,
      subject: `Your Verification Code: ${otp} - Gole Khaja Ghar`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ [EMAIL] Successfully sent OTP email to ${to}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`❌ [EMAIL] Error sending OTP email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
