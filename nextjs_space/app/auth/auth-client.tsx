'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calculator, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AuthPageClient() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', { email: loginEmail, password: loginPw, redirect: false });
      if (res?.error) {
        toast.error('Credenciais inválidas. Verifique e tente novamente.');
      } else {
        router.replace('/');
      }
    } catch {
      toast.error('Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPw !== signupConfirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (signupPw.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, password: signupPw, fullName: signupName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao cadastrar.');
        return;
      }
      // auto-login
      const signInRes = await signIn('credentials', { email: signupEmail, password: signupPw, redirect: false });
      if (signInRes?.error) {
        toast.error('Conta criada, mas houve erro ao entrar. Faça login manualmente.');
        setTab('login');
      } else {
        toast.success('Conta criada com sucesso!');
        router.replace('/');
      }
    } catch {
      toast.error('Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1469B6] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md mb-4">
            <Calculator className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BDI Calc Pro</h1>
          <p className="text-blue-100 text-sm mt-1">Calculadora Profissional de BDI para Obras Públicas</p>
        </div>

        {/* Card */}
        <div className="financial-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">🔒 Autenticação Segura</span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              Cadastrar
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email" placeholder="E-mail" required value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'} placeholder="Senha" required value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" loading={loading}>
                Entrar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text" placeholder="Nome completo" required value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email" placeholder="E-mail" required value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'} placeholder="Senha (mín. 6 caracteres)" required value={signupPw}
                  onChange={(e) => setSignupPw(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password" placeholder="Confirmar senha" required value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" loading={loading}>
                Cadastrar
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
