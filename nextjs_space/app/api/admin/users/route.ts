export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ROLES, addDays, getTrialDays, logAudit } from '@/lib/user-access';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      trialExpiresAt: true, subscriptionExpiresAt: true, createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users);
}

/**
 * Altera um usuário. Corpo: { userId, role? , isActive?, subscriptionDays? }
 * O administrador não pode alterar a própria conta (mesma regra da referência).
 */
export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { userId, role, isActive, subscriptionDays } = body ?? {};
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Você não pode alterar a sua própria conta.' }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const actor = session.user.id;

  if (role !== undefined) {
    if (!ROLES.includes(role)) return NextResponse.json({ error: 'Função inválida' }, { status: 400 });
    const data: any = { role };
    // Trial sem data recebe o período padrão do sistema
    if (role === 'trial' && !target.trialExpiresAt) data.trialExpiresAt = addDays(await getTrialDays());
    await prisma.user.update({ where: { id: userId }, data });
    await logAudit({ userId: actor, action: 'user_role_updated', resourceType: 'user_roles', resourceId: userId, newValues: { role } });
  }

  if (isActive !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: Boolean(isActive) } });
    await logAudit({ userId: actor, action: isActive ? 'user_activated' : 'user_deactivated', resourceType: 'profile', resourceId: userId });
  }

  if (subscriptionDays !== undefined) {
    const days = parseInt(String(subscriptionDays), 10);
    if (!Number.isFinite(days) || days <= 0) return NextResponse.json({ error: 'Número de dias inválido' }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { subscriptionExpiresAt: addDays(days) } });
    await logAudit({ userId: actor, action: 'subscription_updated', resourceType: 'profile', resourceId: userId, newValues: { days } });
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, trialExpiresAt: true, subscriptionExpiresAt: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

/** Exclui um usuário e os cálculos dele. Uso: DELETE /api/admin/users?userId=... */
export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir a sua própria conta.' }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  await prisma.user.delete({ where: { id: userId } });
  await logAudit({ userId: session.user.id, action: 'user_deleted', resourceType: 'profile', resourceId: userId, newValues: { email: target.email } });
  return NextResponse.json({ success: true });
}
