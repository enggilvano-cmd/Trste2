'use client';
// Configurações do Sistema no padrão do app de referência (src/components/settings/SystemSettings.tsx)
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Calculator, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BDI_FIELDS = [
  { key: 'default_ac', label: 'AC — Administração Central' },
  { key: 'default_seguros', label: 'Seguros e Garantias' },
  { key: 'default_riscos', label: 'Riscos' },
  { key: 'default_despesas_financeiras', label: 'Despesas Financeiras' },
  { key: 'default_lucro', label: 'Lucro' },
  { key: 'default_pis', label: 'PIS' },
  { key: 'default_cofins', label: 'COFINS' },
  { key: 'default_iss', label: 'ISS (alíquota municipal)' },
];

export function SystemSettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [values, setValues] = useState<Record<string, string>>({});
  const [trialDays, setTrialDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'trial' | 'bdi' | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setValues(d ?? {});
        if (d?.trial_days) setTrialDays(String(d.trial_days));
      })
      .catch(() => toast.error('Não foi possível carregar as configurações do sistema.'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const save = async (body: Record<string, string>, which: 'trial' | 'bdi', okMsg: string) => {
    try {
      setSaving(which);
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(okMsg);
    } catch {
      toast.error('Não foi possível salvar a configuração.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveTrialDays = () => {
    const days = parseInt(trialDays, 10);
    if (isNaN(days) || days < 0) {
      toast.error('Por favor, insira um número válido de dias.');
      return;
    }
    save({ trial_days: String(days) }, 'trial', 'O período de trial foi atualizado com sucesso.');
  };

  const handleSaveBdi = () => {
    const body: Record<string, string> = {};
    for (const f of BDI_FIELDS) if (values[f.key] !== undefined) body[f.key] = values[f.key];
    save(body, 'bdi', 'Parâmetros padrão do BDI salvos.');
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

  return (
    <div className="container mx-auto p-0 sm:p-6 space-y-6">
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="bdi" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Parâmetros do BDI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-headline">Período de Trial</CardTitle>
              <CardDescription className="text-body">Configure o número de dias do período de teste para novos usuários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trial-days" className="text-caption">Dias de Trial</Label>
                <div className="flex gap-2">
                  <Input
                    id="trial-days"
                    type="number"
                    min="0"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    disabled={loading}
                    className="max-w-[200px]"
                  />
                  <Button onClick={handleSaveTrialDays} disabled={loading || saving === 'trial'}>
                    {saving === 'trial' ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
                <p className="text-caption text-muted-foreground">Novos usuários terão {trialDays || 0} dias de acesso gratuito</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bdi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-headline">Parâmetros Padrão do BDI</CardTitle>
              <CardDescription className="text-body">Estes valores pré-preenchem a calculadora em novos cálculos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BDI_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-2">
                    <Label htmlFor={f.key} className="text-sm">{f.label}</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id={f.key}
                        type="number"
                        step="0.01"
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                        disabled={loading}
                        className="w-24 text-right font-mono"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveBdi} disabled={loading || saving === 'bdi'}>
                {saving === 'bdi' ? 'Salvando...' : 'Salvar Parâmetros'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
