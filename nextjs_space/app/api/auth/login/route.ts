export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { enforceExpiration, isAccessExpired } from '@/lib/user-access';

/**
 * Verificação prévia usada pela tela de login para explicar por que o acesso foi negado
 * (credenciais, conta desativada, trial ou assinatura vencidos). Não cria sessão.
 */
export async function POST(request: Request) {
  try {
    const { email: rawEmail, password } = await request.json();
    const email = String(rawEmail ?? '').trim();
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }
    const expired = isAccessExpired(user);
    const active = await enforceExpiration(user);
    if (!active) {
      let error = 'Conta desativada. Contate o administrador.';
      if (expired && user.role === 'trial') error = 'Seu período de teste expirou. Contate o administrador para continuar.';
      if (expired && user.role === 'subscriber') error = 'Sua assinatura venceu. Contate o administrador para renovar.';
      return NextResponse.json({ error }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
