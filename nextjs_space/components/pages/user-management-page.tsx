'use client';
// Gestão de usuários no padrão do app de referência (blank-canvas-creator-206 / src/components/settings/UserManagement.tsx)
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Shield, Activity, Trash2, Clock, Calendar, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'user' | 'subscriber' | 'trial';

interface Profile {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  isActive: boolean;
  trialExpiresAt?: string | null;
  subscriptionExpiresAt?: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  createdAt: string;
  user?: { email: string; name?: string | null } | null;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'destructive' as const;
    case 'user': return 'default' as const;
    case 'subscriber': return 'secondary' as const;
    default: return 'outline' as const;
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'user': return 'Vitalício';
    case 'trial': return 'Trial';
    case 'subscriber': return 'Assinante';
    default: return role;
  }
};

const ACTION_LABELS: Record<string, string> = {
  user_login: 'login',
  user_signup: 'cadastro',
  user_role_updated: 'função alterada',
  user_activated: 'usuário ativado',
  user_deactivated: 'usuário desativado',
  subscription_updated: 'assinatura atualizada',
  user_deleted: 'usuário excluído',
  trial_expired: 'trial expirado',
  subscription_expired: 'assinatura expirada',
  password_changed: 'senha alterada',
  profile_updated: 'perfil atualizado',
  system_settings_updated: 'configurações do sistema',
};
const getActionLabel = (action: string) => ACTION_LABELS[action] ?? action.replace(/_/g, ' ');

const initial = (u: Profile) => (u.name?.charAt(0) || u.email.charAt(0)).toUpperCase();
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');

export function UserManagementPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const myId = session?.user?.id;
  const [users, setUsers] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'users' | 'audit'>('users');
  const [daysInput, setDaysInput] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast.error('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (!res.ok) throw new Error();
      setAuditLogs(await res.json());
    } catch {
      toast.error('Não foi possível carregar os logs de auditoria.');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isAdmin, fetchUsers, fetchAuditLogs]);

  const patchUser = async (userId: string, body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Erro desconhecido');
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
    fetchAuditLogs();
  };

  const updateUserRole = async (userId: string, role: Role) => {
    try {
      await patchUser(userId, { role });
      toast.success('Função do usuário atualizada com sucesso.');
    } catch (e) {
      toast.error(`Não foi possível atualizar a função do usuário: ${(e as Error).message}`);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await patchUser(userId, { isActive });
      toast.success(isActive ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.');
    } catch {
      toast.error('Não foi possível atualizar o status do usuário.');
    }
  };

  const setSubscriptionDays = async (userId: string) => {
    const days = parseInt(daysInput[userId] ?? '', 10);
    if (!(days > 0)) return;
    try {
      await patchUser(userId, { subscriptionDays: days });
      setDaysInput((p) => ({ ...p, [userId]: '' }));
      toast.success(`Assinatura configurada para ${days} dias.`);
    } catch (e) {
      toast.error((e as Error).message || 'Erro ao configurar assinatura');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Não foi possível remover o usuário');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      fetchAuditLogs();
      toast.success('Usuário removido com sucesso do sistema.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="financial-card">
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Acesso Restrito</h3>
            <p className="text-muted-foreground">Você precisa de permissões de administrador para acessar esta área.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const RoleSelect = ({ user, className }: { user: Profile; className?: string }) => (
    <Select value={user.role} onValueChange={(v) => updateUserRole(user.id, v as Role)} disabled={user.id === myId}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrador</SelectItem>
        <SelectItem value="trial">Trial</SelectItem>
        <SelectItem value="user">Vitalício</SelectItem>
        <SelectItem value="subscriber">Assinante</SelectItem>
      </SelectContent>
    </Select>
  );

  const DeleteDialog = ({ user, trigger, compact }: { user: Profile; trigger: React.ReactNode; compact?: boolean }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className={compact ? 'max-w-[90vw] sm:max-w-md' : 'max-w-[90vw] rounded-xl'}>
        <AlertDialogHeader>
          <AlertDialogTitle className={compact ? 'text-sm sm:text-base' : undefined}>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription className={compact ? 'text-xs sm:text-sm' : undefined}>
            Tem certeza que deseja remover o usuário <span className="font-medium text-foreground">{user.email}</span>? Os cálculos dele também serão excluídos. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {compact ? 'Excluir' : 'Excluir Usuário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 px-2 sm:px-0">
      {/* Abas */}
      <div className="flex flex-row justify-center gap-2 sm:gap-3 px-2 sm:px-0 max-w-md mx-auto w-full">
        <Button
          variant={selectedTab === 'users' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('users')}
          className="flex-1 sm:min-w-[140px] items-center justify-center gap-2 text-sm sm:text-base py-3 sm:py-2"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Usuários</span>
        </Button>
        <Button
          variant={selectedTab === 'audit' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('audit')}
          className="flex-1 sm:min-w-[140px] items-center justify-center gap-2 text-sm sm:text-base py-3 sm:py-2"
        >
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Auditoria</span>
        </Button>
      </div>

      {/* Aba Usuários */}
      {selectedTab === 'users' && (
        <Card className="financial-card w-full overflow-hidden">
          <CardHeader className="space-y-1 px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate">Usuários do Sistema</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gerencie usuários, suas funções e permissões de acesso</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Celular e tablet: cards */}
                <div className="space-y-3 xl:hidden">
                  {users.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarFallback className="text-sm">{initial(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user.name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">{getRoleLabel(user.role)}</Badge>
                              <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">{user.isActive ? 'Ativo' : 'Inativo'}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t mt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground ml-1">Função do Usuário</label>
                            <RoleSelect user={user} className="w-full h-10" />
                          </div>

                          {user.role === 'trial' && user.trialExpiresAt && (
                            <div className="flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Expira em: <span className="font-medium text-foreground">{fmtDate(user.trialExpiresAt)}</span>
                              </span>
                            </div>
                          )}

                          {user.role === 'subscriber' && (
                            <div className="bg-muted/30 p-3 rounded-lg space-y-3 border">
                              <label className="text-xs font-medium text-muted-foreground block">Gerenciar Assinatura</label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    placeholder="Adicionar dias..."
                                    className="w-full h-9 px-3 py-1 text-sm border rounded-md bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={daysInput[user.id] ?? ''}
                                    onChange={(e) => setDaysInput((p) => ({ ...p, [user.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setSubscriptionDays(user.id); }}
                                  />
                                </div>
                                <Button size="sm" className="h-9 px-3 shrink-0" onClick={() => setSubscriptionDays(user.id)}>
                                  <Check className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                              {user.subscriptionExpiresAt && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Vence em: <span className="font-medium text-foreground">{fmtDate(user.subscriptionExpiresAt)}</span></span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <Button
                              variant={user.isActive ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, !user.isActive)}
                              disabled={user.id === myId}
                              className={cn(
                                'flex-1 h-10 font-medium',
                                user.isActive
                                  ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              )}
                            >
                              {user.isActive ? 'Desativar Acesso' : 'Ativar Acesso'}
                            </Button>
                            <DeleteDialog
                              user={user}
                              trigger={
                                <Button variant="destructive" size="icon" disabled={user.id === myId} className="h-10 w-10 shrink-0 rounded-lg">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop: tabela */}
                <div className="hidden xl:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm pl-3 sm:pl-4">Usuário</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Tipo</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Criado</TableHead>
                        <TableHead className="text-xs sm:text-sm pr-3 sm:pr-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="py-3 sm:py-4 pl-3 sm:pl-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                <AvatarFallback className="text-xs sm:text-sm">{initial(user)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium truncate">{user.name || 'Sem nome'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-3 sm:py-4">
                            <div className="flex flex-col gap-2">
                              <RoleSelect user={user} className="w-full sm:w-40 text-xs sm:text-sm" />
                              {user.role === 'trial' && user.trialExpiresAt && (
                                <div className="flex gap-2 items-center flex-wrap">
                                  <span className="text-xs text-muted-foreground">Exp: {fmtDate(user.trialExpiresAt)}</span>
                                </div>
                              )}
                              {user.role === 'subscriber' && (
                                <div className="flex gap-2 items-center flex-wrap">
                                  <input
                                    type="number"
                                    placeholder="Dias"
                                    className="w-16 px-2 py-1 text-xs border rounded bg-background"
                                    value={daysInput[user.id] ?? ''}
                                    onChange={(e) => setDaysInput((p) => ({ ...p, [user.id]: e.target.value }))}
                                  />
                                  <Button size="sm" className="text-xs h-6 px-2" onClick={() => setSubscriptionDays(user.id)}>OK</Button>
                                  {user.subscriptionExpiresAt && (
                                    <span className="text-xs text-muted-foreground">Exp: {fmtDate(user.subscriptionExpiresAt)}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                                disabled={user.id === myId}
                                className="scale-90 sm:scale-100"
                              />
                              <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs hidden lg:inline-flex">
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{fmtDate(user.createdAt)}</TableCell>
                          <TableCell className="py-3 sm:py-4 pr-3 sm:pr-4">
                            <DeleteDialog
                              compact
                              user={user}
                              trigger={
                                <Button variant="outline" size="sm" disabled={user.id === myId} className="text-destructive hover:text-destructive h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aba Auditoria */}
      {selectedTab === 'audit' && (
        <Card className="financial-card w-full overflow-hidden">
          <CardHeader className="space-y-1 px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate">Log de Auditoria</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Histórico completo de atividades do sistema para monitoramento de segurança</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6">
            <div className="overflow-x-auto -mx-2 sm:-mx-4 lg:-mx-6">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm pl-3 sm:pl-4">Usuário</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Ação</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Recurso</TableHead>
                      <TableHead className="text-xs sm:text-sm pr-3 sm:pr-4">Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade registrada.</TableCell>
                      </TableRow>
                    )}
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="py-3 sm:py-4 pl-3 sm:pl-4">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{log.user?.name || log.user?.email || 'Sistema'}</p>
                            <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{getActionLabel(log.action)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-3 sm:py-4">
                          <Badge variant="outline" className="text-xs">{getActionLabel(log.action)}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{log.resourceType}</TableCell>
                        <TableCell className="py-3 sm:py-4 pr-3 sm:pr-4">
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            <span className="hidden sm:inline">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                            <span className="sm:hidden">{new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
