export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await request.json();
  const { userId, ...updates } = body ?? {};
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });

  const data: any = {};
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.role) data.role = updates.role;

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ success: true });
}
