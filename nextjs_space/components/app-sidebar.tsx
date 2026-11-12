'use client';
import { Calculator, LayoutDashboard, History, BookOpen, Settings, LogOut, Menu, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calculadora', label: 'Calculadora', icon: Calculator },
  { id: 'historico', label: 'Meus Cálculos', icon: History },
  { id: 'referencia', label: 'Referência TCU', icon: BookOpen },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
];

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName?: string | null;
  userRole?: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ currentPage, onNavigate, userName, userRole, collapsed, onToggle }: AppSidebarProps) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || userRole === 'admin');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border/60 bg-card flex flex-col transition-all duration-normal',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/40 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shrink-0">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-base text-foreground truncate">BDI Calc Pro</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'relative flex items-center gap-3 w-full h-12 px-3 rounded-2xl transition-all duration-fast text-sm font-medium',
                active
                  ? 'bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg scale-[1.02]'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : '')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && <div className="absolute right-3 w-2 h-2 rounded-full bg-white" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border/40 space-y-2">
        {!collapsed && userName && (
          <div className="px-3 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole ?? 'usuário'}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ redirectTo: '/auth' })}
          className="flex items-center gap-3 w-full h-10 px-3 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
