import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  shopId?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  try {
    const secret = JWT_SECRET || 'super-secret-key-change-me';
    const decoded = jwt.verify(token, secret) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}
