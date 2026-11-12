export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCalcs, monthCalcs, recentCalcs, avgResult] = await Promise.all([
    prisma.bdiCalculation.count({ where: { userId } }),
    prisma.bdiCalculation.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.bdiCalculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.bdiCalculation.aggregate({
      where: { userId },
      _avg: { bdiPercent: true },
    }),
  ]);

  const lastBdi = recentCalcs?.[0]?.bdiPercent ?? null;
  const avgBdi = avgResult?._avg?.bdiPercent ?? null;

  return NextResponse.json({
    totalCalcs,
    lastBdi,
    monthCalcs,
    avgBdi,
    recentCalcs,
  });
}
