import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Perfis de acesso (mesma regra do app de referência)
export const ROLES = ['admin', 'trial', 'user', 'subscriber'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  user: 'Vitalício',
  trial: 'Trial',
  subscriber: 'Assinante',
};

export const DEFAULT_TRIAL_DAYS = 30;

type AccessFields = {
  id: string;
  role: string;
  isActive: boolean;
  trialExpiresAt: Date | null;
  subscriptionExpiresAt: Date | null;
};

/** Data de expiração que vale para o perfil (trial ou assinante); null = não expira. */
export function accessExpiresAt(u: Pick<AccessFields, 'role' | 'trialExpiresAt' | 'subscriptionExpiresAt'>): Date | null {
  if (u.role === 'trial') return u.trialExpiresAt;
  if (u.role === 'subscriber') return u.subscriptionExpiresAt;
  return null;
}

/** Trial ou assinatura vencidos (assinante/trial sem data também conta como vencido). */
export function isAccessExpired(u: Pick<AccessFields, 'role' | 'trialExpiresAt' | 'subscriptionExpiresAt'>, now = new Date()): boolean {
  if (u.role !== 'trial' && u.role !== 'subscriber') return false;
  const exp = accessExpiresAt(u);
  return !exp || exp.getTime() <= now.getTime();
}

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  newValues?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        newValues: entry.newValues,
      },
    });
  } catch (err) {
    console.error('Falha ao gravar auditoria:', err);
  }
}

/** Desativa a conta se o trial/assinatura venceu e registra na auditoria. Devolve o isActive atualizado. */
export async function enforceExpiration(u: AccessFields): Promise<boolean> {
  if (!u.isActive || !isAccessExpired(u)) return u.isActive;
  await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
  await logAudit({
    userId: u.id,
    action: u.role === 'trial' ? 'trial_expired' : 'subscription_expired',
    resourceType: 'profile',
    resourceId: u.id,
  });
  return false;
}

export async function getTrialDays(): Promise<number> {
  const s = await prisma.systemSetting.findUnique({ where: { key: 'trial_days' } });
  const n = s ? parseInt(s.value, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TRIAL_DAYS;
}

export function addDays(days: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
