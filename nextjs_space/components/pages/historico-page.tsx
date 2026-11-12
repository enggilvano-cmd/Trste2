'use client';
import { useEffect, useState } from 'react';
import { Plus, FileDown, Trash2, Eye, Copy, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OBRA_TYPES, getTcuStatusInfo, formatPercent, formatCurrency } from '@/lib/bdi-data';
import { SafeDate } from '@/components/safe-format';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';

interface HistoricoPageProps {
  onNewCalc: () => void;
  onViewCalc: (id: string) => void;
}

export function HistoricoPage({ onNewCalc, onViewCalc }: HistoricoPageProps) {
  const [calcs, setCalcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterObraType, setFilterObraType] = useState('');
  const [filterTcuStatus, setFilterTcuStatus] = useState('');
  const [viewCalc, setViewCalc] = useState<any>(null);

  const loadCalcs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterObraType) params.set('obraType', filterObraType);
    if (filterTcuStatus) params.set('tcuStatus', filterTcuStatus);
    fetch(`/api/calculations?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setCalcs(Array.isArray(d) ? d : []))
      .catch(() => setCalcs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCalcs(); }, [filterObraType, filterTcuStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cálculo?')) return;
    try {
      await fetch(`/api/calculations/${id}`, { method: 'DELETE' });
      toast.success('Cálculo excluído.');
      loadCalcs();
    } catch { toast.error('Erro ao excluir.'); }
  };

  const handleDuplicate = async (calc: any) => {
    try {
      const body = {
        name: (calc?.name ?? '') + ' (cópia)',
        description: calc?.description ?? null,
        obraType: calc?.obraType,
        desoneracao: calc?.desoneracao ?? false,
        regimeYear: calc?.regimeYear ?? null,
        ac: calc?.ac, seguros: calc?.seguros, riscos: calc?.riscos,
        despesasFinanceiras: calc?.despesasFinanceiras, lucro: calc?.lucro,
        pis: calc?.pis, cofins: calc?.cofins, iss: calc?.iss, cprb: calc?.cprb ?? 0,
        bdiPercent: calc?.bdiPercent, custoDireto: calc?.custoDireto ?? null,
        precoVenda: calc?.precoVenda ?? null, tcuStatus: calc?.tcuStatus,
      };
      await fetch('/api/calculations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast.success('Cálculo duplicado com sucesso!');
      loadCalcs();
    } catch { toast.error('Erro ao duplicar.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Meus Cálculos</h2>
          <p className="text-sm text-muted-foreground">Histórico completo dos cálculos de BDI</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onNewCalc} className="gap-1.5 h-9 bg-warning hover:bg-warning/90 text-white border-0">
            <Plus className="h-4 w-4" /><span className="hidden md:inline">Novo Cálculo</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FadeIn>
        <div className="financial-card">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterObraType} onChange={(e) => setFilterObraType(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Todos os tipos</option>
                {OBRA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <select
              value={filterTcuStatus} onChange={(e) => setFilterTcuStatus(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">Todos os status</option>
              <option value="dentro_q1">Dentro do Q1</option>
              <option value="entre_q1_medio">Entre Q1 e Médio</option>
              <option value="entre_medio_q3">Entre Médio e Q3</option>
              <option value="acima_q3">Acima do Q3</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.05}>
        <div className="financial-card">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : (calcs?.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum cálculo encontrado.</p>
              <Button onClick={onNewCalc} variant="outline" size="sm" className="mt-3 gap-1">
                <Plus className="h-3.5 w-3.5" /> Criar cálculo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Tipo</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">BDI</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Custo Direto</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Preço Venda</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Data</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {calcs.map((c: any) => {
                    const si = getTcuStatusInfo(c?.tcuStatus);
                    return (
                      <tr key={c?.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground">{c?.name ?? '—'}</td>
                        <td className="py-3 px-3 text-muted-foreground text-xs hidden md:table-cell">
                          {OBRA_TYPES.find((o) => o.value === c?.obraType)?.label ?? c?.obraType}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">{formatPercent(c?.bdiPercent)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${si?.badgeBg}`}>{si?.label}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground hidden lg:table-cell">{c?.custoDireto ? formatCurrency(c.custoDireto) : '—'}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground hidden lg:table-cell">{c?.precoVenda ? formatCurrency(c.precoVenda) : '—'}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground text-xs">
                          <SafeDate date={c?.createdAt} options={{ day: '2-digit', month: '2-digit', year: 'numeric' }} localize />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setViewCalc(c)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDuplicate(c)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Duplicar">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(c?.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* View Modal */}
      {viewCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewCalc(null)}>
          <div className="financial-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{viewCalc?.name}</h3>
              <button onClick={() => setViewCalc(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <DetailRow label="Tipo de Obra" value={OBRA_TYPES.find((o) => o.value === viewCalc?.obraType)?.label ?? ''} />
              <DetailRow label="BDI" value={formatPercent(viewCalc?.bdiPercent)} highlight />
              <DetailRow label="Status TCU" value={getTcuStatusInfo(viewCalc?.tcuStatus)?.label ?? ''} />
              <DetailRow label="Desoneração" value={viewCalc?.desoneracao ? `Sim — ${viewCalc?.regimeYear}` : 'Não'} />
              <div className="border-t border-border/40 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Componentes</p>
                <DetailRow label="AC" value={formatPercent(viewCalc?.ac)} />
                <DetailRow label="Seguros" value={formatPercent(viewCalc?.seguros)} />
                <DetailRow label="Riscos" value={formatPercent(viewCalc?.riscos)} />
                <DetailRow label="Desp. Financ." value={formatPercent(viewCalc?.despesasFinanceiras)} />
                <DetailRow label="Lucro" value={formatPercent(viewCalc?.lucro)} />
                <DetailRow label="PIS" value={formatPercent(viewCalc?.pis)} />
                <DetailRow label="COFINS" value={formatPercent(viewCalc?.cofins)} />
                <DetailRow label="ISS" value={formatPercent(viewCalc?.iss)} />
                {viewCalc?.desoneracao && <DetailRow label="CPRB" value={formatPercent(viewCalc?.cprb)} />}
              </div>
              {viewCalc?.custoDireto && (
                <div className="border-t border-border/40 pt-3">
                  <DetailRow label="Custo Direto" value={formatCurrency(viewCalc?.custoDireto)} />
                  <DetailRow label="Preço Venda" value={formatCurrency(viewCalc?.precoVenda)} highlight />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => { onViewCalc(viewCalc?.id); setViewCalc(null); }} size="sm" className="gap-1">
                <Eye className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button onClick={() => setViewCalc(null)} variant="outline" size="sm">Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-bold text-primary' : 'font-medium text-foreground'}>{value}</span>
    </div>
  );
}
