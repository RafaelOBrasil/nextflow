import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const logs = await prisma.systemLog.findMany({
    orderBy: { timestamp: 'desc' }
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const log = await prisma.systemLog.create({
    data: {
      userId: body.userId || 'admin',
      action: body.action,
      target: body.target,
      details: body.details,
      type: body.type || 'info'
    }
  });
  return NextResponse.json(log);
}
