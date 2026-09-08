import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    console.warn('⚠️ SMTP_USER or SMTP_PASS is not configured in .env. Emails cannot be sent.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || `Gole Khaja Ghar <${process.env.SMTP_USER || 'noreply@golekhajaghar.com'}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification Code</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px 28px; text-align: center; }
        .greeting { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 12px; text-align: left; }
        .message { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; text-align: left; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ea580c; font-family: monospace; }
        .otp-label { font-size: 12px; color: #9a3412; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
        .notice { font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gole Khaja Ghar</h1>
          <p>Fresh & Authentic Nepali Khaja</p>
        </div>
        <div class="content">
          <div class="greeting">Namaste ${name || 'Customer'},</div>
          <div class="message">
            Thank you for registering with Gole Khaja Ghar. Please use the following One-Time Password (OTP) to complete your email verification:
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Verification Code (Valid for 5 minutes)</div>
          </div>
          <div class="notice">
            If you did not request this verification code, please ignore this email. Do not share this code with anyone.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gole Khaja Ghar. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `Your Verification Code: ${otp} - Gole Khaja Ghar`,
    html: htmlContent,
    text: `Namaste ${name || 'Customer'},\n\nYour Gole Khaja Ghar verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share it with anyone.`,
  });
}
