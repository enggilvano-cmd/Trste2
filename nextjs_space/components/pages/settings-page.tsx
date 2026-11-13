'use client';
// Configurações do usuário no padrão do app de referência (src/components/settings/SettingsPage.tsx — Preferências › Aparência)
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<string>('light');

  useEffect(() => {
    if (theme) setLocalTheme(theme);
  }, [theme]);

  const handleSaveSettings = () => {
    setTheme(localTheme);
    toast.success('Configurações salvas.');
  };

  return (
    <div className="space-y-6 fade-in pb-6 sm:pb-8 max-w-[1400px] mx-auto spacing-responsive-md">
      <div>
        <h2 className="text-headline font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferências
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-body-large">Aparência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <p className="text-caption text-muted-foreground mb-2">Escolha a aparência do aplicativo</p>
                <Select value={localTheme} onValueChange={setLocalTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">Salvar Configurações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
