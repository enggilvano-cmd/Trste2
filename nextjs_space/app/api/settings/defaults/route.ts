export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const settings = await prisma.systemSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    const key = s.key.replace('default_', '').replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    map[key] = s.value;
  }
  return NextResponse.json(map);
}
