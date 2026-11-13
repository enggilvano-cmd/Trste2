'use client';
import { BookOpen, Calculator, Info, AlertTriangle } from 'lucide-react';
import { OBRA_TYPES, TCU_LIMITS, formatPercent, DESONERACAO_RULES, TCU_COMPONENT_RANGES, type ComponentKey } from '@/lib/bdi-data';

const COMPONENTES: { key: ComponentKey; label: string }[] = [
  { key: 'ac', label: 'AC' },
  { key: 'seguros', label: 'S + G' },
  { key: 'riscos', label: 'Riscos' },
  { key: 'despesasFinanceiras', label: 'DF' },
  { key: 'lucro', label: 'Lucro' },
];
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';

export function ReferenciaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Referência Técnica TCU</h2>
        <p className="text-sm text-muted-foreground">Limites de BDI conforme Acórdão 2.622/2013 do TCU</p>
      </div>

      {/* Tabela de limites */}
      <FadeIn>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" /> Limites de BDI por Tipo de Obra
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-2 sm:px-3 text-muted-foreground font-medium">Tipo de Obra</th>
                  <th className="text-center py-3 px-1 sm:px-3 text-green-600 font-medium"><span className="sm:hidden">Q1</span><span className="hidden sm:inline">1º Quartil (Q1)</span></th>
                  <th className="text-center py-3 px-1 sm:px-3 text-blue-600 font-medium">Médio</th>
                  <th className="text-center py-3 px-1 sm:px-3 text-yellow-600 font-medium"><span className="sm:hidden">Q3</span><span className="hidden sm:inline">3º Quartil (Q3)</span></th>
                </tr>
              </thead>
              <tbody>
                {OBRA_TYPES.map((t) => {
                  const l = TCU_LIMITS[t.value];
                  return (
                    <tr key={t.value} className="border-b border-border/30">
                      <td className="py-3 px-2 sm:px-3 font-medium text-foreground">{t.label}</td>
                      <td className="py-3 px-1 sm:px-3 text-center font-mono text-green-600 font-semibold">{formatPercent(l?.q1)}</td>
                      <td className="py-3 px-1 sm:px-3 text-center font-mono text-blue-600 font-semibold">{formatPercent(l?.medio)}</td>
                      <td className="py-3 px-1 sm:px-3 text-center font-mono text-yellow-600 font-semibold">{formatPercent(l?.q3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>

      {/* Fórmula */}
      <FadeIn delay={0.05}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-primary" /> Fórmula do BDI (TCU)
          </h3>
          <div className="bg-muted/50 rounded-xl p-3 sm:p-4 font-mono text-xs sm:text-sm text-center break-words">
            {"BDI = { [(1 + (AC + S + R + G)/100) × (1 + DF/100) × (1 + L/100)] / (1 − T/100) } − 1"}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Onde T = PIS + COFINS + ISS + CPRB (se desonerado). AC, Seguros, Riscos e Garantias somam-se no mesmo fator, conforme o Acórdão 2.622/2013. O BDI é aplicado sobre o Custo Direto para obter o Preço de Venda.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            O Acórdão 2.622/2013 não trata da CPRB nas faixas de BDI. Para não penalizar o regime desonerado, a calculadora corrige cada limite pelo fator (1 − I₀) / (1 − I₀ − CPRB), com I₀ = PIS + COFINS + ISS. A faixa de referência vai do 1º ao 3º quartil; valores abaixo do Q1 também ficam fora dela.
          </p>

          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Faixas de cada parcela por tipo de obra (Acórdão 2622/2013, item 9.2.1) — 1º quartil / médio / 3º quartil</p>
            <div className="space-y-3 xl:hidden">
              {OBRA_TYPES.map((t) => (
                <div key={t.value} className="rounded-xl border border-border/60 p-3">
                  <p className="text-sm font-medium text-foreground mb-2">{t.label}</p>
                  <div className="space-y-1">
                    {COMPONENTES.map((c) => {
                      const r = TCU_COMPONENT_RANGES[t.value][c.key];
                      return (
                        <div key={c.key} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">{c.label}</span>
                          <span className="font-mono whitespace-nowrap">{formatPercent(r.q1)} / {formatPercent(r.medio)} / {formatPercent(r.q3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Tipo de Obra</th>
                    {COMPONENTES.map((c) => <th key={c.key} className="text-center py-2 px-2 text-muted-foreground font-medium">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {OBRA_TYPES.map((t) => (
                    <tr key={t.value} className="border-b border-border/30">
                      <td className="py-2 px-2 font-medium text-foreground">{t.label}</td>
                      {COMPONENTES.map((c) => {
                        const r = TCU_COMPONENT_RANGES[t.value][c.key];
                        return <td key={c.key} className="py-2 px-2 text-center font-mono whitespace-nowrap">{formatPercent(r.q1)} / {formatPercent(r.medio)} / {formatPercent(r.q3)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>ISS</strong> (item 9.3.2.3): percentual compatível com a lei do município da obra, aplicando a alíquota (entre 2% e 5%) sobre a base de cálculo definida na legislação municipal.
              <strong> PIS/COFINS</strong> (itens 9.3.2.4 e 9.3.2.5): no regime cumulativo, 0,65% e 3,00%; no não cumulativo, a média dos percentuais efetivamente recolhidos; no Simples Nacional, as alíquotas do Anexo IV da LC 123/2006.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Desoneração */}
      <FadeIn delay={0.1}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-primary" /> Desoneração da Folha — Lei 14.973/2024
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            A Lei 14.973/2024 estabelece a reoneração gradual da folha de pagamento. As empresas que optaram pela
            Contribuição Previdenciária sobre a Receita Bruta (CPRB) terão alíquotas reduzidas gradualmente:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ano</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CPRB</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CPP Folha</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">Observação</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DESONERACAO_RULES).map(([year, rule]) => (
                  <tr key={year} className="border-b border-border/30">
                    <td className="py-2 px-3 font-semibold text-foreground">{year}</td>
                    <td className="py-2 px-3 text-center font-mono text-primary">{formatPercent(rule.cprb)}</td>
                    <td className="py-2 px-3 text-center font-mono text-warning">{formatPercent(rule.cpp)}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell">{rule.label}</td>
                  </tr>
                ))}
                <tr className="border-b border-border/30">
                  <td className="py-2 px-3 font-semibold text-foreground">2028+</td>
                  <td className="py-2 px-3 text-center font-mono text-muted-foreground">—</td>
                  <td className="py-2 px-3 text-center font-mono text-destructive">20,00%</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell">Sem CPRB — CPP integral sobre a folha</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>

      {/* O que NÃO entra no BDI */}
      <FadeIn delay={0.15}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" /> O que NÃO pode entrar no BDI
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Administração Local da obra (deve ser item do orçamento)',
              'Instalação e Manutenção de Canteiro de Obras',
              'Mobilização e Desmobilização',
              'Acampamento',
              'Transporte de pessoal',
              'Equipamentos de Proteção Individual e Coletiva (EPIs/EPCs)',
              'Ferramentas manuais',
              'IRPJ e CSLL (tributos sobre o lucro)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Estes itens devem ser detalhados como custos diretos no orçamento da obra, conforme Acórdão 2.622/2013 do TCU.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
