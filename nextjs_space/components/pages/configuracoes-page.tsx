'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Save, Users, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';

export function ConfiguracoesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="financial-card max-w-md text-center p-8">
          <Shield className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Acesso Restrito</h3>
          <p className="text-sm text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Área administrativa do sistema</p>
      </div>
      <DefaultsSection />
      <UsersSection />
    </div>
  );
}

function DefaultsSection() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setValues(d ?? {}))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success('Parâmetros salvos!');
    } catch {
      toast.error('Erro ao salvar parâmetros.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'default_ac', label: 'AC — Administração Central' },
    { key: 'default_seguros', label: 'Seguros e Garantias' },
    { key: 'default_riscos', label: 'Riscos' },
    { key: 'default_despesas_financeiras', label: 'Despesas Financeiras' },
    { key: 'default_lucro', label: 'Lucro' },
    { key: 'default_pis', label: 'PIS' },
    { key: 'default_cofins', label: 'COFINS' },
    { key: 'default_iss', label: 'ISS' },
  ];

  return (
    <FadeIn>
      <div className="financial-card">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-primary" /> Parâmetros Padrão do BDI
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Estes valores pré-preenchem a calculadora para novos cálculos.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-2">
              <label className="text-sm text-foreground">{f.label}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.01"
                  value={values?.[f.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...(prev ?? {}), [f.key]: e.target.value }))}
                  className="w-20 h-8 px-2 text-right rounded-lg border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} loading={saving} className="mt-4 gap-1.5">
          <Save className="h-4 w-4" /> Salvar Parâmetros
        </Button>
      </div>
    </FadeIn>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      toast.success(`Usuário ${!isActive ? 'ativado' : 'desativado'}.`);
      loadUsers();
    } catch { toast.error('Erro.'); }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      toast.success(`Papel alterado para ${newRole}.`);
      loadUsers();
    } catch { toast.error('Erro.'); }
  };

  return (
    <FadeIn delay={0.05}>
      <div className="financial-card">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" /> Gerenciamento de Usuários
        </h3>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">E-mail</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Papel</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Ativo</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u?.id} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium text-foreground">{u?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{u?.email ?? ''}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u?.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {u?.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${u?.isActive ? 'bg-success' : 'bg-destructive'}`} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleRole(u?.id, u?.role)} className="px-2 py-1 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                          {u?.role === 'admin' ? 'Tornar Usuário' : 'Tornar Admin'}
                        </button>
                        <button onClick={() => toggleActive(u?.id, u?.isActive)} className="px-2 py-1 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                          {u?.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
