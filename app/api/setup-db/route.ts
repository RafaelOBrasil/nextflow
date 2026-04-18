import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  return NextResponse.json({ dbUrl: process.env.DATABASE_URL });
}
