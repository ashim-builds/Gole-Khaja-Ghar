import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASS in your server .env file.');
  }

  const isGmail = host.includes('gmail') || user.includes('@gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  // Log OTP in server console for quick dev & debugging access
  console.log(`\n========================================`);
  console.log(`📨 [OTP EMAIL] To: ${to}`);
  console.log(`🔑 OTP CODE: [ ${otp} ]`);
  console.log(`========================================\n`);

  const transporter = getTransporter();
  const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const isGmail = host.includes('gmail') || smtpUser.includes('@gmail.com');

  // When using Gmail SMTP, From MUST match the authenticated account to avoid SPF/DMARC failure & spam routing
  const from = isGmail
    ? `Gole Khaja Ghar <${smtpUser}>`
    : (process.env.SMTP_FROM || (smtpUser ? `Gole Khaja Ghar <${smtpUser}>` : `Gole Khaja Ghar <noreply@golekhajaghar.com>`));

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
  <!-- Hidden Preheader for email inbox preview -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #ffffff; opacity: 0; mso-hide: all;">
    Your Gole Khaja Ghar verification code is: ${otp}. Valid for 5 minutes.
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; width: 100%; margin: 0; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #ea580c; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Gole Khaja Ghar</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffedd5; font-weight: 600;">Fresh &amp; Authentic Nepali Khaja</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px; background-color: #ffffff; text-align: left;">
              <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                Namaste ${name || 'Customer'},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you for registering with Gole Khaja Ghar. Use the 6-digit verification code below to complete your email verification:
              </p>

              <!-- Prominent OTP Display Box -->
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

          <!-- Footer -->
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

  await transporter.sendMail({
    from,
    to,
    subject: `Your Verification Code: ${otp} - Gole Khaja Ghar`,
    html: htmlContent,
    text: `Namaste ${name || 'Customer'},\n\nYour Gole Khaja Ghar verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share it with anyone.\n\nThank you,\nGole Khaja Ghar`,
  });
}
