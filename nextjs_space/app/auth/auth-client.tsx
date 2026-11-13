'use client';
// Tela de autenticação no padrão do app de referência (blank-canvas-creator-206 / src/pages/Auth.tsx)
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calculator, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function AuthPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    fetch('/api/signup').then((r) => r.json()).then((d) => setTrialDays(d?.trialDays ?? null)).catch(() => {});
  }, []);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (res?.error) {
        // pergunta ao servidor o motivo (credenciais, conta desativada, trial/assinatura vencidos)
        const why = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        }).then((r) => r.json()).catch(() => null);
        toast.error(why?.error ?? 'Credenciais inválidas. Verifique e tente novamente.');
      } else {
        router.replace('/');
      }
    } catch {
      toast.error('Erro ao entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('As senhas não coincidem.'); return; }
    if (form.password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, fullName: form.fullName }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Erro ao cadastrar.'); return; }
      const signInRes = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (signInRes?.error) {
        toast.error('Conta criada, mas houve erro ao entrar. Faça login manualmente.');
        setActiveTab('signin');
      } else {
        toast.success('Conta criada com sucesso!');
        router.replace('/');
      }
    } catch {
      toast.error('Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>;

  const PasswordInput = ({ id, placeholder }: { id: string; placeholder: string }) => (
    <div className="relative">
      <Input id={id} type={showPassword ? 'text' : 'password'} placeholder={placeholder} value={form.password} onChange={set('password')} required />
      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#1469B6] dark:bg-background flex items-start justify-center p-4 pt-8 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-transform duration-300">
              <Calculator className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">BDI Calc Pro</h1>
          <p className="text-blue-100">Cálculo de BDI para Obras Públicas — Acórdão TCU 2.622/2013</p>
        </div>

        <Card className="financial-card transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Autenticação Segura
            </CardTitle>
            <CardDescription>Acesse sua conta com segurança</CardDescription>
          </CardHeader>
          <CardContent>
            {trialDays !== null && trialDays > 0 && activeTab === 'signup' && (
              <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-primary font-medium">
                  Você tem <span className="font-bold">{trialDays}</span> dias para conhecer o sistema gratuitamente!
                </p>
              </div>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
                    <Input id="signin-email" type="text" inputMode="email" autoComplete="username" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2"><Lock className="h-4 w-4" />Senha</Label>
                    {PasswordInput({ id: 'signin-password', placeholder: 'Sua senha' })}
                  </div>
                  <Button type="submit" className="w-full floating-action" disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2"><User className="h-4 w-4" />Nome Completo</Label>
                    <Input id="signup-name" type="text" placeholder="Seu nome completo" value={form.fullName} onChange={set('fullName')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
                    <Input id="signup-email" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2"><Lock className="h-4 w-4" />Senha</Label>
                    {PasswordInput({ id: 'signup-password', placeholder: 'Mínimo 6 caracteres' })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <Input id="signup-confirm-password" type="password" placeholder="Confirme sua senha" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  </div>
                  <Button type="submit" className="w-full floating-action" disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">🔐 Recursos de Segurança:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Senhas protegidas com criptografia (bcrypt)</li>
                <li>• Controle de acesso por perfil e prazo</li>
                <li>• Auditoria completa de atividades</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
