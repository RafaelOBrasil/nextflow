import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('API change-password body:', body);
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      console.log('Missing userId or newPassword');
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed');

    console.log('Updating user in database...');
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });
    console.log('User updated');

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
