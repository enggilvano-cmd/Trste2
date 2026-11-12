'use client';
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { DashboardPage } from './pages/dashboard-page';
import { CalculadoraPage } from './pages/calculadora-page';
import { HistoricoPage } from './pages/historico-page';
import { ReferenciaPage } from './pages/referencia-page';
import { ConfiguracoesPage } from './pages/configuracoes-page';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  calculadora: 'Calculadora de BDI',
  historico: 'Meus Cálculos',
  referencia: 'Referência TCU',
  configuracoes: 'Configurações',
};

export function AppShellClient() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editCalcId, setEditCalcId] = useState<string | null>(null);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setEditCalcId(null);
  }, []);

  const handleNewCalc = useCallback(() => {
    setEditCalcId(null);
    setCurrentPage('calculadora');
  }, []);

  const handleViewCalc = useCallback((id: string) => {
    setEditCalcId(id);
    setCurrentPage('calculadora');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDF2F7]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-pulse">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth');
  }

  if (!session?.user?.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDF2F7]">
        <div className="financial-card max-w-md text-center p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Conta Desativada</h2>
          <p className="text-muted-foreground">Sua conta foi desativada. Contate o administrador.</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNewCalc={handleNewCalc} onViewCalc={handleViewCalc} />;
      case 'calculadora': return <CalculadoraPage editCalcId={editCalcId} onSaved={() => setCurrentPage('historico')} />;
      case 'historico': return <HistoricoPage onNewCalc={handleNewCalc} onViewCalc={handleViewCalc} />;
      case 'referencia': return <ReferenciaPage />;
      case 'configuracoes': return <ConfiguracoesPage />;
      default: return <DashboardPage onNewCalc={handleNewCalc} onViewCalc={handleViewCalc} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF2F7]">
      <AppSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userName={session?.user?.name}
        userRole={session?.user?.role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />
      <AppHeader
        title={PAGE_TITLES[currentPage] ?? 'Dashboard'}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed((p) => !p)}
      />
      <main
        className={cn(
          'pt-14 min-h-screen transition-all duration-normal',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        <div className="px-6 py-6 max-w-7xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
