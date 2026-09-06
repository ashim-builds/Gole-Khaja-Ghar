import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { signUserToken, signAdminToken } from '../auth/jwt.js';
import { registerSchema, loginSchema, adminLoginSchema } from '../validators/schemas.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input data';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { name, email, phone, password } = validation.data;
    const lowerEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existingUser) {
      res.status(400).json({ error: 'Account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: lowerEmail,
        phone: phone || null,
        passwordHash,
        role: 'CUSTOMER',
        authProvider: 'LOCAL',
      },
    });

    const token = await signUserToken(user.id, user.email || '', user.role.toLowerCase());

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, email, password } = req.body;
    const loginIdentifier = (identifier || email || '').trim();

    if (!loginIdentifier || !password) {
      res.status(400).json({ error: 'Please enter your email, phone, or employee code and password' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier.toLowerCase() },
          { phone: loginIdentifier },
          { staffProfile: { employeeCode: loginIdentifier.toUpperCase() } },
        ],
      },
      include: {
        staffProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.role === 'WAITER' && user.staffProfile && !user.staffProfile.isActive) {
      res.status(403).json({ error: 'Your staff account is currently deactivated. Please contact admin.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: 'Please sign in with Google' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = await signUserToken(user.id, user.email || user.phone || user.id, user.role.toLowerCase());

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        employeeCode: user.staffProfile?.employeeCode || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.json({ success: true, user: null });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      res.json({ success: true, user: null });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('user_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ success: true });
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const validation = adminLoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const { password } = validation.data;
    const actualPassword = process.env.ADMIN_PASSWORD;

    if (!actualPassword) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const passwordBuffer = Buffer.from(password);
    const actualBuffer = Buffer.from(actualPassword);

    const isMatch =
      passwordBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, actualBuffer);

    if (isMatch) {
      const token = await signAdminToken();
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminLogout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ success: true });
}

function getGoogleRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const host = req.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}/api/auth/google/callback`;
}

export function googleOAuthInitiate(req: Request, res: Response): void {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (!GOOGLE_CLIENT_ID) {
    res.redirect(`${clientUrl}/login?error=Google_OAuth_Not_Configured`);
    return;
  }

  const redirectUri = getGoogleRedirectUri(req);
  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  res.redirect(googleAuthUrl);
}

export async function googleOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (error || !code) {
      res.redirect(`${clientUrl}/login?error=Google_Auth_Failed`);
      return;
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getGoogleRedirectUri(req);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData: any = await tokenResponse.json();
    if (!tokenResponse.ok) {
      res.redirect(`${clientUrl}/login?error=Token_Exchange_Failed`);
      return;
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData: any = await profileResponse.json();
    if (!profileResponse.ok) {
      res.redirect(`${clientUrl}/login?error=Profile_Fetch_Failed`);
      return;
    }

    const email = profileData.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profileData.id },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: profileData.name || 'Google User',
          email,
          googleId: profileData.id,
          role: 'CUSTOMER',
          authProvider: 'GOOGLE',
        },
      });
    }

    const token = await signUserToken(user.id, user.email || '', user.role.toLowerCase());

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.redirect(`${clientUrl}/`);
  } catch (error) {
    console.error('Google callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=Internal_Error`);
  }
}
