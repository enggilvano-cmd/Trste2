'use client';
import { useEffect, useState } from 'react';
import { Calculator, TrendingUp, Calendar, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OBRA_TYPES, getTcuStatusInfo, formatPercent } from '@/lib/bdi-data';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';

interface DashboardPageProps {
  onNewCalc: () => void;
  onViewCalc: (id: string) => void;
}

interface DashboardData {
  totalCalcs: number;
  lastBdi: number | null;
  monthCalcs: number;
  avgBdi: number | null;
  recentCalcs: any[];
}

export function DashboardPage({ onNewCalc, onViewCalc }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calculations/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total de Cálculos', value: data?.totalCalcs ?? 0, icon: Calculator, color: 'bg-primary/10 text-primary' },
    { label: 'Último BDI', value: data?.lastBdi != null ? formatPercent(data.lastBdi) : '—', icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { label: 'Cálculos do Mês', value: data?.monthCalcs ?? 0, icon: Calendar, color: 'bg-warning/10 text-warning' },
    { label: 'Média de BDI', value: data?.avgBdi != null ? formatPercent(data.avgBdi) : '—', icon: BarChart3, color: 'bg-success/10 text-success' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="financial-card h-28 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Resumo dos seus cálculos de BDI</p>
      </div>

      {/* KPIs */}
      <Stagger className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={i}>
              <div className="financial-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Recent Calcs Table */}
      <FadeIn>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground mb-4">Últimos Cálculos</h3>
          {(data?.recentCalcs?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum cálculo realizado ainda.</p>
              <Button onClick={onNewCalc} variant="outline" size="sm" className="mt-3 gap-1">
                <Plus className="h-3.5 w-3.5" /> Criar primeiro cálculo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Tipo de Obra</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">BDI</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Status TCU</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentCalcs ?? []).map((calc: any) => {
                    const statusInfo = getTcuStatusInfo(calc?.tcuStatus);
                    const obraLabel = OBRA_TYPES.find((o) => o.value === calc?.obraType)?.label ?? calc?.obraType;
                    return (
                      <tr
                        key={calc?.id}
                        onClick={() => onViewCalc(calc?.id)}
                        className="border-b border-border/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-medium text-foreground">{calc?.name ?? '—'}</td>
                        <td className="py-3 px-3 text-muted-foreground text-xs hidden md:table-cell">{obraLabel}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                          {formatPercent(calc?.bdiPercent)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo?.badgeBg}`}>
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground text-xs hidden sm:table-cell">
                          <SafeDate date={calc?.createdAt} options={{ day: '2-digit', month: '2-digit', year: 'numeric' }} localize />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
