export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const url = new URL(request.url);
  const obraType = url.searchParams.get('obraType') || undefined;
  const tcuStatus = url.searchParams.get('tcuStatus') || undefined;

  const where: any = { userId: session.user.id };
  if (obraType) where.obraType = obraType;
  if (tcuStatus) where.tcuStatus = tcuStatus;

  const calcs = await prisma.bdiCalculation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(calcs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const calc = await prisma.bdiCalculation.create({
    data: {
      userId: session.user.id,
      name: body.name,
      description: body.description || null,
      obraType: body.obraType,
      desoneracao: body.desoneracao ?? false,
      regimeYear: body.regimeYear ?? null,
      ac: body.ac,
      seguros: body.seguros,
      riscos: body.riscos,
      despesasFinanceiras: body.despesasFinanceiras,
      lucro: body.lucro,
      pis: body.pis,
      cofins: body.cofins,
      iss: body.iss,
      issAliquota: body.issAliquota ?? null,
      issBase: body.issBase ?? null,
      cprb: body.cprb ?? 0,
      bdiPercent: body.bdiPercent,
      custoDireto: body.custoDireto ?? null,
      precoVenda: body.precoVenda ?? null,
      tcuStatus: body.tcuStatus,
    },
  });

  return NextResponse.json(calc, { status: 201 });
}
