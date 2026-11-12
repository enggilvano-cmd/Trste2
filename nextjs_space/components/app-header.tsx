'use client';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title: string;
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  children?: React.ReactNode;
}

export function AppHeader({ title, sidebarCollapsed, onMenuClick, children }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-14 border-b border-border/40 bg-card/80 backdrop-blur-lg flex items-center justify-between px-6 transition-all duration-normal',
        sidebarCollapsed ? 'left-[72px]' : 'left-64'
      )}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-1.5 rounded-lg hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
}
