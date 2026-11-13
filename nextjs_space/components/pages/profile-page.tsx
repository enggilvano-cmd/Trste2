'use client';
// Perfil no padrão do app de referência (src/components/settings/UserProfile.tsx)
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Key, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRoleLabel } from './user-management-page';

type Me = {
  id: string; email: string; name?: string | null; role: string; isActive: boolean;
  trialExpiresAt?: string | null; subscriptionExpiresAt?: string | null; createdAt: string;
};

const roleVariant = (role: string) =>
  role === 'admin' ? 'destructive' : role === 'user' ? 'default' : role === 'subscriber' ? 'secondary' : 'outline';

export function ProfilePage() {
  const { update } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d: Me) => { setMe(d); setFullName(d?.name ?? ''); })
      .catch(() => toast.error('Não foi possível carregar o perfil.'));
  }, []);

  const updateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fullName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setMe(data);
      await update();
      toast.success('Perfil atualizado com sucesso.');
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) { toast.error('As senhas não coincidem.'); return; }
    if (pw.next.length < 6) { toast.error('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setSavingPw(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Senha alterada com sucesso.');
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível alterar a senha.');
    } finally {
      setSavingPw(false);
    }
  };

  if (!me) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const expiration =
    me.role === 'admin' || me.role === 'user'
      ? 'Vitalício'
      : me.role === 'trial' && me.trialExpiresAt
        ? new Date(me.trialExpiresAt).toLocaleDateString('pt-BR')
        : me.role === 'subscriber' && me.subscriptionExpiresAt
          ? new Date(me.subscriptionExpiresAt).toLocaleDateString('pt-BR')
          : '-';

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card className="financial-card">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Atualize suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {(me.name?.charAt(0) || me.email.charAt(0)).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg">{me.name || 'Sem Nome'}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">{me.email}</p>
                  <Badge variant={roleVariant(me.role)} className="mt-1.5 text-xs">{getRoleLabel(me.role)}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm">Nome Completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Digite seu nome completo" className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input id="email" type="email" value={me.email} disabled className="text-sm" />
                  <p className="text-xs text-muted-foreground">O e-mail de acesso só pode ser alterado por um administrador.</p>
                </div>
                <Button onClick={updateProfile} disabled={saving} className="w-full sm:w-fit">
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                Segurança
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 sm:p-4 border rounded-lg space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Alterar Senha</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="pw-current" className="text-xs">Senha atual</Label>
                    <Input id="pw-current" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pw-next" className="text-xs">Nova senha</Label>
                    <Input id="pw-next" type="password" placeholder="Mínimo 6 caracteres" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pw-confirm" className="text-xs">Confirmar nova senha</Label>
                    <Input id="pw-confirm" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
                  </div>
                </div>
                <Button variant="outline" onClick={changePassword} disabled={savingPw || !pw.current || !pw.next} className="w-full sm:w-fit">
                  {savingPw ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:col-span-1">
          <Card className="financial-card">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs sm:text-sm font-medium">Status</span>
                <Badge variant={me.isActive ? 'default' : 'secondary'} className="text-xs">{me.isActive ? 'Ativa' : 'Inativa'}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs sm:text-sm font-medium">Função</span>
                <Badge variant={roleVariant(me.role)} className="text-xs">{getRoleLabel(me.role)}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs sm:text-sm font-medium">Membro desde</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{new Date(me.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs sm:text-sm font-medium">Expiração</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{expiration}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
