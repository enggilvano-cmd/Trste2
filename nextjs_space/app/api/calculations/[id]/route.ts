export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  const calc = await prisma.bdiCalculation.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!calc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(calc);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  const calc = await prisma.bdiCalculation.findFirst({ where: { id, userId: session.user.id } });
  if (!calc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await prisma.bdiCalculation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
