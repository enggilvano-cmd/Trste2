export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { addDays, getTrialDays, logAudit } from '@/lib/user-access';

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password, fullName } = await request.json();
    const email = String(rawEmail ?? '').trim();
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
    }
    // Novos cadastros entram como Trial pelo número de dias definido em Configurações do Sistema
    const trialDays = await getTrialDays();
    const hashed = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: String(fullName).trim(),
        role: 'trial',
        trialExpiresAt: addDays(trialDays),
      },
    });
    await logAudit({ userId: user.id, action: 'user_signup', resourceType: 'profile', resourceId: user.id, newValues: { role: 'trial', trialDays } });
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}

/** Dias de trial oferecidos no cadastro (informativo, exibido na tela de login). */
export async function GET() {
  return NextResponse.json({ trialDays: await getTrialDays() });
}
