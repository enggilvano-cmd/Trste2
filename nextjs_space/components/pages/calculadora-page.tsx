'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calculator, Save, Trash2, FileDown, Info, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  OBRA_TYPES, TCU_LIMITS, DESONERACAO_RULES, DEFAULT_BDI_VALUES,
  BDI_RANGES, TCU_COMPONENT_RANGES, ISS_ALIQUOTA_MIN, ISS_ALIQUOTA_MAX, calcIssEfetivo,
  calculateBDI, getTcuLimits, getTcuStatus, getTcuStatusInfo, type Quartis,
  formatCurrency, formatPercent, ObraTypeValue,
} from '@/lib/bdi-data';
import { FadeIn } from '@/components/ui/animate';
import { CurrencyInput } from '@/components/ui/currency-input';

interface CalculadoraPageProps {
  editCalcId?: string | null;
  onSaved?: () => void;
}

export function CalculadoraPage({ editCalcId, onSaved }: CalculadoraPageProps) {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [obraType, setObraType] = useState<ObraTypeValue>('edificios');
  const [desoneracao, setDesoneracao] = useState(false);
  const [regimeYear, setRegimeYear] = useState(2026);

  const [ac, setAc] = useState(DEFAULT_BDI_VALUES.ac);
  const [seguros, setSeguros] = useState(DEFAULT_BDI_VALUES.seguros);
  const [riscos, setRiscos] = useState(DEFAULT_BDI_VALUES.riscos);
  const [df, setDf] = useState(DEFAULT_BDI_VALUES.despesasFinanceiras);
  const [lucro, setLucro] = useState(DEFAULT_BDI_VALUES.lucro);
  const [pis, setPis] = useState(DEFAULT_BDI_VALUES.pis);
  const [cofins, setCofins] = useState(DEFAULT_BDI_VALUES.cofins);
  // ISS (Acórdão 2622/2013, item 9.3.2.3): alíquota municipal × base de cálculo da lei municipal
  const [issAliquota, setIssAliquota] = useState(DEFAULT_BDI_VALUES.iss);
  const [issBase, setIssBase] = useState(100);
  const iss = calcIssEfetivo(issAliquota, issBase);

  // custo direto em centavos (campo com máscara: 1.234.567,89)
  const [custoCents, setCustoCents] = useState(0);
  const [saving, setSaving] = useState(false);

  // A coluna de resultado só acompanha a rolagem quando cabe inteira na tela;
  // se for mais alta (tela baixa ou avisos extras), rola junto para nada ficar escondido.
  const resultColRef = useRef<HTMLDivElement>(null);
  const [resultColFits, setResultColFits] = useState(false);
  useEffect(() => {
    const el = resultColRef.current;
    if (!el) return;
    const check = () => setResultColFits(el.offsetHeight + 72 + 16 <= window.innerHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check);
    return () => { ro.disconnect(); window.removeEventListener('resize', check); };
  });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Load defaults from system settings
  useEffect(() => {
    if (editCalcId) return;
    fetch('/api/settings/defaults')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ac != null) setAc(Number(d.ac));
        if (d?.seguros != null) setSeguros(Number(d.seguros));
        if (d?.riscos != null) setRiscos(Number(d.riscos));
        if (d?.despesasFinanceiras != null) setDf(Number(d.despesasFinanceiras));
        if (d?.lucro != null) setLucro(Number(d.lucro));
        if (d?.pis != null) setPis(Number(d.pis));
        if (d?.cofins != null) setCofins(Number(d.cofins));
        if (d?.iss != null) { setIssAliquota(Number(d.iss)); setIssBase(100); }
      })
      .catch(() => {});
  }, [editCalcId]);

  // Load existing calc for view
  useEffect(() => {
    if (!editCalcId) return;
    setLoadingEdit(true);
    fetch(`/api/calculations/${editCalcId}`)
      .then((r) => r.json())
      .then((c: any) => {
        if (c?.id) {
          setName(c.name ?? '');
          setDescription(c.description ?? '');
          setObraType(c.obraType as ObraTypeValue);
          setDesoneracao(c.desoneracao ?? false);
          setRegimeYear(c.regimeYear ?? 2026);
          setAc(c.ac ?? DEFAULT_BDI_VALUES.ac);
          setSeguros(c.seguros ?? DEFAULT_BDI_VALUES.seguros);
          setRiscos(c.riscos ?? DEFAULT_BDI_VALUES.riscos);
          setDf(c.despesasFinanceiras ?? DEFAULT_BDI_VALUES.despesasFinanceiras);
          setLucro(c.lucro ?? DEFAULT_BDI_VALUES.lucro);
          setPis(c.pis ?? DEFAULT_BDI_VALUES.pis);
          setCofins(c.cofins ?? DEFAULT_BDI_VALUES.cofins);
          if (c.issAliquota != null && c.issBase != null) {
            setIssAliquota(c.issAliquota); setIssBase(c.issBase);
          } else {
            // cálculos antigos guardavam só o ISS efetivo
            setIssAliquota(c.iss ?? DEFAULT_BDI_VALUES.iss); setIssBase(100);
          }
          setCustoCents(c.custoDireto != null ? Math.round(Number(c.custoDireto) * 100) : 0);
        }
      })
      .catch(() => toast.error('Erro ao carregar cálculo.'))
      .finally(() => setLoadingEdit(false));
  }, [editCalcId]);

  const cprbValue = desoneracao ? (DESONERACAO_RULES[regimeYear]?.cprb ?? 0) : 0;

  const bdiResult = useMemo(() => {
    return calculateBDI({ ac, seguros, riscos, despesasFinanceiras: df, lucro, pis, cofins, iss, cprb: cprbValue });
  }, [ac, seguros, riscos, df, lucro, pis, cofins, iss, cprbValue]);

  const totalTributos = pis + cofins + iss + cprbValue;
  // Faixas do TCU corrigidas pela CPRB quando há desoneração (os quartis originais não incluem a CPRB).
  const limits = useMemo(
    () => getTcuLimits(obraType, cprbValue, pis + cofins + iss),
    [obraType, cprbValue, pis, cofins, iss],
  );
  const limitesAjustados = cprbValue > 0;
  const tcuStatus = useMemo(() => getTcuStatus(bdiResult, obraType, limits), [bdiResult, obraType, limits]);
  const comp = TCU_COMPONENT_RANGES[obraType];
  const aplicarMediosTcu = () => {
    setAc(comp.ac.medio); setSeguros(comp.seguros.medio); setRiscos(comp.riscos.medio);
    setDf(comp.despesasFinanceiras.medio); setLucro(comp.lucro.medio);
    toast.success('Valores médios do TCU aplicados para este tipo de obra.');
  };
  const issAliquotaFora = issAliquota < ISS_ALIQUOTA_MIN || issAliquota > ISS_ALIQUOTA_MAX;
  const issBaseFora = issBase <= 0 || issBase > 100;
  const statusInfo = getTcuStatusInfo(tcuStatus);
  const custoNum = custoCents / 100;
  const precoVenda = custoNum > 0 ? custoNum * (1 + bdiResult / 100) : 0;

  const handleClear = () => {
    setName(''); setDescription(''); setObraType('edificios');
    setDesoneracao(false); setRegimeYear(2026);
    setAc(DEFAULT_BDI_VALUES.ac); setSeguros(DEFAULT_BDI_VALUES.seguros);
    setRiscos(DEFAULT_BDI_VALUES.riscos); setDf(DEFAULT_BDI_VALUES.despesasFinanceiras);
    setLucro(DEFAULT_BDI_VALUES.lucro); setPis(DEFAULT_BDI_VALUES.pis);
    setCofins(DEFAULT_BDI_VALUES.cofins); setIssAliquota(DEFAULT_BDI_VALUES.iss); setIssBase(100);
    setCustoCents(0);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome da obra.'); return; }
    setSaving(true);
    try {
      const body = {
        name, description, obraType, desoneracao, regimeYear: desoneracao ? regimeYear : null,
        ac, seguros, riscos, despesasFinanceiras: df, lucro, pis, cofins, iss, issAliquota, issBase, cprb: cprbValue,
        bdiPercent: Math.round(bdiResult * 10000) / 10000,
        custoDireto: custoNum || null, precoVenda: precoVenda || null, tcuStatus,
      };
      const res = await fetch('/api/calculations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success('Cálculo salvo com sucesso!');
      onSaved?.();
    } catch {
      toast.error('Erro ao salvar cálculo.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      // gerado no navegador: não depende de serviço externo
      const { downloadBdiPdf } = await import('@/lib/bdi-pdf');
      downloadBdiPdf({
        name: name || 'Cálculo de BDI', description, obraType, desoneracao, regimeYear,
        ac, seguros, riscos, despesasFinanceiras: df, lucro, pis, cofins,
        issAliquota, issBase, iss, cprb: cprbValue,
        bdi: bdiResult, custoDireto: custoNum, precoVenda, totalTributos,
        tcuStatus, limits: limits ?? TCU_LIMITS[obraType], author: session?.user?.name ?? session?.user?.email,
      });
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar o PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loadingEdit) {
    return <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="financial-card h-32 animate-pulse bg-muted" />)}</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
      {/* Seção A - Identificação */}
      <FadeIn>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-primary" /> Identificação do Cálculo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Nome da Obra *</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Edifício Sede - Prefeitura" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de Obra *</label>
              <select
                value={obraType} onChange={(e) => setObraType(e.target.value as ObraTypeValue)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {OBRA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Descrição (opcional)</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={2} placeholder="Observações sobre o cálculo..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Seção B - Regime Tributário */}
      <FadeIn delay={0.05}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-primary" /> Regime Tributário
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setDesoneracao(!desoneracao)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${desoneracao ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${desoneracao ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-foreground">Regime de Desoneração da Folha (CPRB)</span>
          </div>
          {desoneracao && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Ano de referência</label>
              <select
                value={regimeYear} onChange={(e) => setRegimeYear(Number(e.target.value))}
                className="w-full max-w-xs h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {Object.entries(DESONERACAO_RULES).map(([year, rule]) => (
                  <option key={year} value={year}>{rule.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  CPRB = {DESONERACAO_RULES[regimeYear]?.cprb ?? 0}%
                </span>
                <span className="inline-block px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium">
                  CPP Folha = {DESONERACAO_RULES[regimeYear]?.cpp ?? 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conforme Lei 14.973/2024 — Reoneração gradual. A CPRB substitui a contribuição patronal sobre a folha.
              </p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Seção C - Componentes do BDI */}
      <FadeIn delay={0.1}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" /> Componentes do BDI
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 -mt-1">
              <p className="text-xs text-muted-foreground">
                Faixas de referência (1º quartil – 3º quartil) para <strong>{OBRA_TYPES.find((o) => o.value === obraType)?.label}</strong>, Acórdão 2622/2013 item 9.2.1.
              </p>
              <Button onClick={aplicarMediosTcu} variant="outline" size="sm">Usar valores médios do TCU</Button>
            </div>
            <BdiField label="Administração Central (AC)" desc={BDI_RANGES.ac.desc} value={ac} onChange={setAc} range={comp.ac} />
            <BdiField label="Seguros e Garantias (S + G)" desc={BDI_RANGES.seguros.desc} value={seguros} onChange={setSeguros} range={comp.seguros} />
            <BdiField label="Riscos (R)" desc={BDI_RANGES.riscos.desc} value={riscos} onChange={setRiscos} range={comp.riscos} />
            <BdiField label="Despesas Financeiras (DF)" desc={BDI_RANGES.despesasFinanceiras.desc} value={df} onChange={setDf} range={comp.despesasFinanceiras} />
            <BdiField label="Lucro (L)" desc={BDI_RANGES.lucro.desc} value={lucro} onChange={setLucro} range={comp.lucro} />

            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tributos</p>
              <div className="space-y-4">
                <BdiField label="PIS" desc={BDI_RANGES.pis.desc} value={pis} onChange={setPis} hint="cumulativo: 0,65%" />
                <BdiField label="COFINS" desc={BDI_RANGES.cofins.desc} value={cofins} onChange={setCofins} hint="cumulativo: 3,00%" />

                <div className="rounded-lg border border-border/60 p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">ISS</p>
                    <p className="text-xs text-muted-foreground">
                      Conforme a lei do município onde a obra será executada (Acórdão 2622/2013, item 9.3.2.3). ISS no BDI = alíquota × base de cálculo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Alíquota municipal (%)</label>
                      <input type="number" step="0.01" value={issAliquota} onChange={(e) => setIssAliquota(parseFloat(e.target.value) || 0)}
                        className={`w-full h-9 px-2 text-right rounded-lg border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none ${issAliquotaFora ? 'border-orange-400' : 'border-border'}`} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Base de cálculo (% do preço)</label>
                      <input type="number" step="1" value={issBase} onChange={(e) => setIssBase(parseFloat(e.target.value) || 0)}
                        className={`w-full h-9 px-2 text-right rounded-lg border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none ${issBaseFora ? 'border-orange-400' : 'border-border'}`} />
                    </div>
                    <div className="h-9 flex items-center justify-between px-3 rounded-lg bg-muted/50">
                      <span className="text-xs text-muted-foreground">ISS no BDI</span>
                      <span className="text-sm font-semibold font-mono text-foreground">{formatPercent(iss)}</span>
                    </div>
                  </div>
                  {issAliquotaFora && (
                    <p className="text-xs text-orange-600">⚠ A alíquota do ISS deve ficar entre 2% (ADCT, art. 88) e 5% (LC 116/2003, art. 8º, II).</p>
                  )}
                  {issBaseFora && (
                    <p className="text-xs text-orange-600">⚠ A base de cálculo deve ser maior que 0% e no máximo 100%.</p>
                  )}
                  {obraType === 'fornecimento' && (
                    <p className="text-xs text-muted-foreground">Em itens de mero fornecimento de materiais e equipamentos, verifique se há prestação de serviço sujeita a ISS; a venda de mercadoria não sofre ISS.</p>
                  )}
                </div>

                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  PIS/COFINS cumulativos valem para receitas até 31/12/2026. A partir de 2027 a CBS substitui o PIS/COFINS (LC 214/2025) e a CPRB cai para 1,80%. Para execução a partir de 2027, preveja BDI por exercício ou cláusula de reequilíbrio.
                </p>

                {desoneracao && (
                  <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">CPRB (Desoneração)</p>
                      <p className="text-xs text-muted-foreground">Calculado automaticamente pelo ano selecionado</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatPercent(cprbValue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      </div>

      {/* Coluna de resultado: fica visível ao rolar no desktop largo */}
      <div ref={resultColRef} className={`space-y-6 xl:space-y-4 min-w-0 ${resultColFits ? 'xl:sticky xl:top-[72px]' : ''}`}>
      {/* Seção D - Custo Direto e Resultado */}
      <FadeIn delay={0.15}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground mb-4">Custo Direto e Resultado</h3>
          <div className="mb-4">
            <label htmlFor="custo-direto" className="text-xs font-medium text-muted-foreground block mb-1">Custo Direto</label>
            <CurrencyInput id="custo-direto" value={custoCents} onValueChange={setCustoCents} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">BDI Calculado</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{formatPercent(bdiResult)}</p>
            </div>
            <div className="bg-warning/5 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Tributos no BDI</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning tabular-nums">{formatPercent(totalTributos)}</p>
            </div>
          </div>

          <div className="mt-3 bg-success/5 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1 text-center">Preço de Venda</p>
            {custoNum > 0 ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-success text-center tabular-nums whitespace-nowrap">{formatCurrency(precoVenda)}</p>
                <div className="mt-3 pt-2 border-t border-border/40 space-y-1 text-xs">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Custo direto</span><span className="font-mono tabular-nums text-foreground">{formatCurrency(custoNum)}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">BDI ({formatPercent(bdiResult)})</span><span className="font-mono tabular-nums text-foreground">+ {formatCurrency(precoVenda - custoNum)}</span></div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-1">Informe o custo direto para calcular</p>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Seção E - Conformidade TCU */}
      <FadeIn delay={0.2}>
        <div className={`financial-card border ${statusInfo?.border}`}>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            {tcuStatus === 'acima_q3' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
            Conformidade TCU — Acórdão 2622/2013
          </h3>
          <div className={`rounded-xl p-4 xl:p-3 ${statusInfo?.bg} mb-4 xl:mb-3`}>
            <p className={`text-lg font-bold ${statusInfo?.color}`}>{statusInfo?.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {OBRA_TYPES.find((o) => o.value === obraType)?.label}<span className="xl:hidden"> — Q1: {formatPercent(limits?.q1)} | Médio: {formatPercent(limits?.medio)} | Q3: {formatPercent(limits?.q3)}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Faixas do BDI: Acórdão 2.622/2013, item 9.1.</p>
            {limitesAjustados && (
              <p className="text-xs text-muted-foreground mt-1">
                Faixas ajustadas pela CPRB de {formatPercent(cprbValue)} (critério do programa: o Acórdão não publica faixas com desoneração). Originais do Acórdão (sem CPRB): Q1 {formatPercent(TCU_LIMITS[obraType]?.q1)} | Médio {formatPercent(TCU_LIMITS[obraType]?.medio)} | Q3 {formatPercent(TCU_LIMITS[obraType]?.q3)}
              </p>
            )}
          </div>

          {/* Barra visual */}
          {limits && <TcuGauge bdi={bdiResult} q1={limits.q1} medio={limits.medio} q3={limits.q3} status={tcuStatus} />}
          {(tcuStatus === 'abaixo_q1') && (
            <p className="text-xs text-orange-600 mt-3 font-medium">
              ⚠ BDI abaixo do 1º quartil, fora da faixa de referência do TCU. Não é irregular por si só, mas convém justificar a composição e verificar a exequibilidade da proposta.
            </p>
          )}
          {tcuStatus === 'acima_q3' && (
            <p className="text-xs text-destructive mt-3 font-medium">
              ⚠ BDI acima do 3º quartil exige justificativa fundamentada conforme Acórdão 2622/2013 do TCU.
            </p>
          )}
        </div>
      </FadeIn>

      {/* Botões */}
      <div className="flex flex-wrap gap-3 xl:[&>button]:flex-1">
        <Button onClick={handleSave} loading={saving} className="gap-1.5 bg-warning hover:bg-warning/90 text-white border-0">
          <Save className="h-4 w-4" /> Salvar Cálculo
        </Button>
        <Button onClick={handleClear} variant="outline" className="gap-1.5">
          <Trash2 className="h-4 w-4" /> Limpar Formulário
        </Button>
        <Button onClick={handleExportPdf} variant="outline" loading={exportingPdf} className="gap-1.5">
          <FileDown className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>
      </div>
    </div>
  );
}

function BdiField({ label, desc, value, onChange, range, hint }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; range?: Quartis; hint?: string;
}) {
  const fora = range ? value < range.q1 || value > range.q3 : false;
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
        {fora && range && (
          <p className="text-xs text-orange-600 mt-0.5">⚠ Fora da faixa do TCU ({formatPercent(range.q1)} – {formatPercent(range.q3)}). Justifique no memorial.</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number" step="0.01" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-24 h-9 px-2 text-right rounded-lg border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none ${fora ? 'border-orange-400' : 'border-border'}`}
        />
        <span className="text-xs text-muted-foreground">%</span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline w-44">
          {range ? <>Q1 {formatPercent(range.q1)} · Méd {formatPercent(range.medio)} · Q3 {formatPercent(range.q3)}</> : hint}
        </span>
      </div>
    </div>
  );
}

/**
 * Régua de conformidade TCU. A escala é centrada na faixa de referência (Q1–Q3),
 * não começa em 0%, para que as zonas que importam fiquem largas e legíveis.
 */
const GAUGE_ZONES = [
  { key: 'abaixo_q1', label: 'Abaixo do Q1', bar: 'bg-orange-400/35 dark:bg-orange-500/30', dot: 'bg-orange-400', badge: 'bg-orange-500' },
  { key: 'entre_q1_medio', label: 'Q1 – Médio', bar: 'bg-blue-500/55 dark:bg-blue-500/50', dot: 'bg-blue-500', badge: 'bg-blue-600' },
  { key: 'entre_medio_q3', label: 'Médio – Q3', bar: 'bg-amber-400/70 dark:bg-amber-400/55', dot: 'bg-amber-400', badge: 'bg-amber-500' },
  { key: 'acima_q3', label: 'Acima do Q3', bar: 'bg-red-500/35 dark:bg-red-500/35', dot: 'bg-red-500', badge: 'bg-red-600' },
] as const;

/** Afasta rótulos de quartis vizinhos quando estão a menos de 14% da largura um do outro. */
function tickShift(i: number, pQ1: number, pMed: number, pQ3: number) {
  const near = (a: number, b: number) => b - a < 14;
  if (i === 0) return near(pQ1, pMed) ? '-85%' : '-50%';
  if (i === 2) return near(pMed, pQ3) ? '-15%' : '-50%';
  if (near(pQ1, pMed) && !near(pMed, pQ3)) return '-15%';
  if (near(pMed, pQ3) && !near(pQ1, pMed)) return '-85%';
  return '-50%';
}

const fmtPp = (v: number) => `${Math.abs(v).toFixed(2).replace('.', ',')} p.p.`;

function TcuGauge({ bdi, q1, medio, q3, status }: { bdi: number; q1: number; medio: number; q3: number; status: string }) {
  const span = Math.max(q3 - q1, 0.5);
  // a escala acompanha o BDI só até 1,2× a faixa; além disso o marcador fica na borda com seta
  const lo = Math.max(0, Math.max(q1 - span * 1.2, Math.min(q1 - span * 0.6, bdi - span * 0.2)));
  const hi = Math.min(q3 + span * 1.2, Math.max(q3 + span * 0.6, bdi + span * 0.2));
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const foraDireita = bdi > hi;
  const foraEsquerda = bdi < lo;
  const [pQ1, pMed, pQ3, pBdi] = [pos(q1), pos(medio), pos(q3), pos(bdi)];
  const zone = GAUGE_ZONES.find((z) => z.key === status) ?? GAUGE_ZONES[1];
  const segments = [
    { ...GAUGE_ZONES[0], from: 0, to: pQ1 },
    { ...GAUGE_ZONES[1], from: pQ1, to: pMed },
    { ...GAUGE_ZONES[2], from: pMed, to: pQ3 },
    { ...GAUGE_ZONES[3], from: pQ3, to: 100 },
  ];
  const ticks = [
    { label: 'Q1', value: q1, p: pQ1 },
    { label: 'Médio', value: medio, p: pMed },
    { label: 'Q3', value: q3, p: pQ3 },
  ];
  const distancia =
    bdi > q3 ? `${fmtPp(bdi - q3)} acima do Q3`
    : bdi < q1 ? `${fmtPp(q1 - bdi)} abaixo do Q1`
    : `margem de ${fmtPp(q3 - bdi)} até o Q3`;

  return (
    <div className="space-y-3" role="img" aria-label={`BDI ${formatPercent(bdi)}: ${zone.label}. Q1 ${formatPercent(q1)}, médio ${formatPercent(medio)}, Q3 ${formatPercent(q3)}.`}>
      {/* Selo do BDI acima da barra */}
      <div className="relative h-8">
        <div
          className="absolute bottom-0 flex flex-col items-center transition-all duration-500"
          style={pBdi < 15 ? { left: 0 } : pBdi > 85 ? { right: 0 } : { left: `${pBdi}%`, transform: 'translateX(-50%)' }}
        >
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold text-white shadow-sm whitespace-nowrap ${zone.badge}`}>
            {foraEsquerda && '‹ '}BDI {formatPercent(bdi)}{foraDireita && ' ›'}
          </span>
        </div>
      </div>

      {/* Barra */}
      <div className="relative">
        <div className="relative h-4 rounded-full overflow-hidden bg-muted">
          {segments.map((s) => (
            <div key={s.key} className={`absolute inset-y-0 ${s.bar}`} style={{ left: `${s.from}%`, width: `${Math.max(0, s.to - s.from)}%` }} />
          ))}
          {/* divisões nos quartis */}
          {ticks.map((t) => (
            <div key={t.label} className="absolute inset-y-0 w-px bg-background/80" style={{ left: `${t.p}%` }} />
          ))}
        </div>
        {/* Marcador do BDI */}
        <div
          className="absolute -top-1.5 -bottom-1.5 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background transition-all duration-500"
          style={{ left: `${Math.min(99, Math.max(1, pBdi))}%` }}
        />
      </div>

      {/* Valores dos quartis, alinhados às divisões */}
      <div className="relative h-9">
        {ticks.map((t, i) => (
          <div
            key={t.label}
            className="absolute top-0 flex flex-col items-center text-center leading-tight"
            style={{
              left: `${t.p}%`,
              // evita sobreposição quando Q1 e Médio estão muito próximos
              transform: `translateX(${tickShift(i, pQ1, pMed, pQ3)})`,
            }}
          >
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</span>
            <span className="text-xs font-mono font-semibold text-foreground">{formatPercent(t.value)}</span>
          </div>
        ))}
      </div>

      {/* Legenda + distância */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1 border-t border-border/40">
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
          {GAUGE_ZONES.map((z) => (
            <span key={z.key} className={`flex items-center gap-1.5 text-[11px] ${z.key === status ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              <span className={`h-2.5 w-2.5 rounded-sm ${z.dot}`} />
              {z.label}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground pt-2">{distancia}</span>
      </div>
    </div>
  );
}
