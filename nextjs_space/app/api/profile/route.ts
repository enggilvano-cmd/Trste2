export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/user-access';

const SELECT = { id: true, email: true, name: true, role: true, isActive: true, trialExpiresAt: true, subscriptionExpiresAt: true, createdAt: true };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: SELECT });
  return NextResponse.json(user);
}

/** Atualiza o próprio perfil. Corpo: { name? } ou { currentPassword, newPassword } */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = session.user.id;

  if (body.newPassword !== undefined) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !(await bcrypt.compare(String(body.currentPassword ?? ''), user.password))) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    }
    if (String(body.newPassword).length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }
    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(String(body.newPassword), 12) } });
    await logAudit({ userId: id, action: 'password_changed', resourceType: 'profile', resourceId: id });
    return NextResponse.json({ success: true });
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: 'Informe o nome.' }, { status: 400 });
    const user = await prisma.user.update({ where: { id }, data: { name }, select: SELECT });
    await logAudit({ userId: id, action: 'profile_updated', resourceType: 'profile', resourceId: id });
    return NextResponse.json(user);
  }

  return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
}
