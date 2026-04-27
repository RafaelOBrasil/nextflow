import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validação básica (sem firula)
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca usuário + loja em UMA query (evita roundtrip)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        shop: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            users: {
              where: { role: 'SHOP_ADMIN' },
              select: { email: true },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Regra de negócio (importante)
    if (user.shop && ['blocked', 'expired'].includes(user.shop.status)) {
      return NextResponse.json(
        { error: 'Loja bloqueada ou expirada' },
        { status: 403 }
      );
    }

    // Token enxuto (sem excesso de payload)
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        shopId: user.shopId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        shop: user.shop
          ? {
              id: user.shop.id,
              slug: user.shop.slug,
              name: user.shop.name,
              adminEmail: user.shop.users[0]?.email
            }
          : null
      }
    });

  } catch (error) {
    console.error('LOGIN_ERROR:', error);

    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
