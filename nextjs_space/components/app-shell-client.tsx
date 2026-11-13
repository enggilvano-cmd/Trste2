'use client';
// Layout no padrão do app de referência (blank-canvas-creator-206 / src/components/Layout.tsx)
import React, { useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Home, Calculator, History, BookOpen, Settings, Users, LogOut, User, Plus } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardPage } from './pages/dashboard-page';
import { CalculadoraPage } from './pages/calculadora-page';
import { HistoricoPage } from './pages/historico-page';
import { ReferenciaPage } from './pages/referencia-page';
import { UserManagementPage } from './pages/user-management-page';
import { SystemSettingsPage } from './pages/system-settings-page';
import { ProfilePage } from './pages/profile-page';
import { SettingsPage } from './pages/settings-page';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'calculadora', label: 'Calculadora', icon: Calculator },
  { id: 'historico', label: 'Meus Cálculos', icon: History },
  { id: 'referencia', label: 'Referência TCU', icon: BookOpen },
];

const ROLE_SUFFIX: Record<string, string> = {
  admin: '• Administrador',
  user: '• Vitalício',
  subscriber: '• Assinante',
  trial: '• Trial',
};

const getFirstName = (fullName?: string | null) => (fullName ? fullName.split(' ')[0] : null);

/** Mesmo texto da referência: "N dias restantes", "Nh restantes", "Nm restantes" ou "Expirado". */
function timeRemaining(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const left = new Date(expiresAt).getTime() - Date.now();
  if (left <= 0) return 'Expirado';
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours}h restantes`;
  return `${Math.floor((left % 3600000) / 60000)}m restantes`;
}

type Profile = { name?: string | null; email?: string | null; role?: string; expiresAt?: string | null };

function ProfileMenuItems({ isAdmin, onPageChange }: { isAdmin: boolean; onPageChange: (p: string) => void }) {
  return (
    <>
      <DropdownMenuItem onClick={() => onPageChange('profile')}>
        <User className="mr-2 h-4 w-4" />
        Perfil
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onPageChange('settings')}>
        <Settings className="mr-2 h-4 w-4" />
        Configurações
      </DropdownMenuItem>
      {isAdmin && (
        <>
          <DropdownMenuItem onClick={() => onPageChange('users')}>
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPageChange('system-settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações do Sistema
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => signOut({ redirectTo: '/auth' })} className="text-destructive">
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </DropdownMenuItem>
    </>
  );
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105" onClick={onClick}>
      <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg flex-shrink-0">
        <Calculator className="h-4 w-4 text-yellow-400" />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-tight text-foreground">BDI Calc Pro</h1>
      </div>
    </div>
  );
}

function AppSidebar({ currentPage, onPageChange, profile }: { currentPage: string; onPageChange: (p: string) => void; profile: Profile }) {
  const { state: sidebarState, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = sidebarState === 'collapsed';
  const isAdmin = profile.role === 'admin';
  const remaining = !isAdmin ? timeRemaining(profile.expiresAt) : null;

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      className={cn(
        'transition-all duration-300 ease-out',
        isMobile ? 'fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-[70]' : isCollapsed ? 'w-[72px] z-[70]' : 'w-64 z-[70]'
      )}
      collapsible={isMobile ? 'offcanvas' : 'icon'}
      variant={isMobile ? 'floating' : 'sidebar'}
    >
      <SidebarContent className="backdrop-blur-xl border-r shadow-lg h-full bg-sidebar border-sidebar-border">
        <div className={cn('border-b border-border/30 flex items-center justify-end', isMobile ? 'px-4 py-4' : isCollapsed ? 'px-3 pt-6 pb-4' : 'px-4 pt-6 pb-4')}>
          <SidebarTrigger className={cn('hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md', isMobile ? 'h-8 w-8' : 'h-9 w-9')} />
        </div>

        <SidebarGroup>
          <SidebarGroupContent className={cn(isMobile ? 'px-4' : isCollapsed ? 'px-0' : 'px-4')}>
            <SidebarMenu className={cn('space-y-2', isCollapsed && !isMobile && 'space-y-3 items-center')}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handlePageChange(item.id)}
                      isActive={isActive}
                      className={cn(
                        'w-full transition-all duration-300 group relative overflow-hidden',
                        isMobile ? 'h-12 rounded-2xl' : isCollapsed ? 'h-14 w-14 rounded-2xl justify-center items-center p-0 mx-auto flex shrink-0' : 'h-12 rounded-2xl',
                        isActive
                          ? isMobile
                            ? 'bg-gradient-to-r from-primary to-primary-glow text-primary-foreground data-[active=true]:text-primary-foreground shadow-lg scale-[1.01]'
                            : isCollapsed
                              ? 'bg-gradient-to-br from-primary to-primary-glow text-primary-foreground data-[active=true]:text-primary-foreground shadow-xl scale-105 ring-2 ring-primary/20'
                              : 'bg-gradient-to-r from-primary to-primary-glow text-primary-foreground data-[active=true]:text-primary-foreground shadow-lg scale-[1.02]'
                          : isMobile
                            ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] hover:shadow-md'
                            : isCollapsed
                              ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-110 hover:shadow-lg'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] hover:shadow-md'
                      )}
                      tooltip={isCollapsed && !isMobile ? item.label : undefined}
                    >
                      {isCollapsed && !isMobile ? (
                        <div className="flex w-full items-center justify-center">
                          <Icon className={cn('h-6 w-6 flex-shrink-0 transition-all duration-300', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                        </div>
                      ) : (
                        <Icon className={cn('transition-all duration-300 h-5 w-5 mr-3', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                      )}
                      {(!isCollapsed || isMobile) && (
                        <>
                          <span className="font-medium transition-all duration-300 text-sm">{item.label}</span>
                          {isActive && <div className="absolute right-3 w-2 h-2 rounded-full bg-primary-foreground/80" />}
                        </>
                      )}
                      {isActive && isCollapsed && !isMobile && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-l-full" />
                      )}
                    </SidebarMenuButton>
                    {isCollapsed && !isMobile && index < menuItems.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-6 h-px bg-border/50"></div>
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Perfil do usuário */}
        <div className={cn('mt-auto border-t border-border/30', isMobile ? 'px-4 py-4' : isCollapsed ? 'px-0 py-4 flex justify-center' : 'px-4 py-4')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'group transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-[1.02]',
                  isMobile ? 'w-full h-12 rounded-2xl justify-start gap-3' : isCollapsed ? 'h-14 w-14 rounded-2xl p-0 flex items-center justify-center' : 'w-full h-12 rounded-2xl justify-start gap-3'
                )}
              >
                <Avatar className={cn(isMobile ? 'h-8 w-8' : isCollapsed ? 'h-10 w-10' : 'h-8 w-8')}>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(profile.name?.charAt(0) || profile.email?.charAt(0) || '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {(!isCollapsed || isMobile) && (
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-foreground group-hover:text-accent-foreground">{getFirstName(profile.name) || 'Usuário'}</p>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">{ROLE_SUFFIX[profile.role ?? ''] ?? ''}</span>
                    </div>
                    {remaining && <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 mt-0.5">{remaining}</span>}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[80]">
              <ProfileMenuItems isAdmin={isAdmin} onPageChange={handlePageChange} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function LayoutContent({ currentPage, onPageChange, profile, pageHeaderButtons, children }: { currentPage: string; onPageChange: (p: string) => void; profile: Profile; pageHeaderButtons?: React.ReactNode; children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const isAdmin = profile.role === 'admin';

  return (
    <>
      {/* Header mobile */}
      {isMobile && (
        <header className="safe-top fixed top-0 left-0 right-0 z-[60] h-14 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm transition-transform duration-300">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center touch-target">
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <div className="w-full h-0.5 bg-foreground rounded-full"></div>
                  <div className="w-full h-0.5 bg-foreground rounded-full"></div>
                  <div className="w-full h-0.5 bg-foreground rounded-full"></div>
                </div>
              </SidebarTrigger>
              <Logo onClick={() => onPageChange('dashboard')} />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 touch-target cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(profile.name?.charAt(0) || profile.email?.charAt(0) || '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[80]">
                  <ProfileMenuItems isAdmin={isAdmin} onPageChange={onPageChange} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      <div className={cn('flex flex-1 w-full', isMobile ? 'pt-14' : 'min-h-screen')}>
        <AppSidebar currentPage={currentPage} onPageChange={onPageChange} profile={profile} />

        <main className="flex-1 w-full overflow-x-hidden overflow-y-auto safe-bottom">
          {/* Header desktop */}
          {!isMobile && (
            <header className="fixed top-0 left-0 right-0 z-[60] h-14 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
              <div
                className="flex items-center justify-center h-full px-4 transition-all duration-300"
                style={{
                  marginLeft: open ? 'var(--sidebar-width, 224px)' : '72px',
                  width: open ? 'calc(100% - var(--sidebar-width, 224px))' : 'calc(100% - 72px)',
                  position: 'relative',
                }}
              >
                <div className="flex items-center gap-3">
                  {pageHeaderButtons && (
                    <>
                      <div className="flex items-center gap-1 [&>button]:h-8 [&>button]:text-xs [&>button]:px-2">{pageHeaderButtons}</div>
                      <div className="w-px h-6 bg-border/30"></div>
                    </>
                  )}
                  <Logo onClick={() => onPageChange('dashboard')} />
                </div>
              </div>
            </header>
          )}

          {/* Botões da página no celular: barra fixa abaixo do header (igual à referência) */}
          {isMobile && pageHeaderButtons && (
            <div className="fixed left-0 right-0 top-14 z-40 flex items-center justify-center gap-1 px-2 py-1 border-b h-[58px] bg-background/95 backdrop-blur-xl">
              <div className="flex items-center gap-1 [&>button]:h-8 [&>button]:text-xs [&>button]:px-2">{pageHeaderButtons}</div>
            </div>
          )}

          <div className={cn('w-full h-full transition-all duration-300', isMobile ? cn('px-3 pb-6', pageHeaderButtons ? 'pt-[72px]' : 'pt-4') : 'px-[52px] py-[52px] pt-[72px]')}>
            <div className={cn('mx-auto w-full', isMobile ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1600px]')}>{children}</div>
          </div>
        </main>
      </div>
    </>
  );
}

export function AppShellClient() {
  const { data: session, status } = useSession();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState('dashboard');
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
      <div className="h-screen flex items-center justify-center bg-[#EDF2F7] dark:bg-gradient-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (status === 'unauthenticated' || !session?.user) {
    redirect('/auth');
  }

  const profile: Profile = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    expiresAt: session.user.expiresAt,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'calculadora': return <CalculadoraPage editCalcId={editCalcId} onSaved={() => setCurrentPage('historico')} />;
      case 'historico': return <HistoricoPage onNewCalc={handleNewCalc} onViewCalc={handleViewCalc} />;
      case 'referencia': return <ReferenciaPage />;
      case 'profile': return <ProfilePage />;
      case 'settings': return <SettingsPage />;
      case 'users': return <UserManagementPage />;
      case 'system-settings': return <SystemSettingsPage />;
      default: return <DashboardPage onNewCalc={handleNewCalc} onViewCalc={handleViewCalc} />;
    }
  };

  const pageHeaderButtons =
    currentPage === 'dashboard' || currentPage === 'historico' ? (
      <Button onClick={handleNewCalc} className="gap-1.5 bg-warning hover:bg-warning/90 text-white border-0">
        <Plus className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Novo Cálculo</span>
      </Button>
    ) : null;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="h-screen flex w-full bg-[#EDF2F7] dark:bg-gradient-surface overflow-hidden">
        <LayoutContent currentPage={currentPage} onPageChange={handleNavigate} profile={profile} pageHeaderButtons={pageHeaderButtons}>
          {renderPage()}
        </LayoutContent>
      </div>
    </SidebarProvider>
  );
}
