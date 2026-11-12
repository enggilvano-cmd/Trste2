'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator, Save, Trash2, FileDown, Info, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  OBRA_TYPES, TCU_LIMITS, DESONERACAO_RULES, DEFAULT_BDI_VALUES,
  BDI_RANGES, calculateBDI, getTcuStatus, getTcuStatusInfo,
  formatCurrency, formatPercent, ObraTypeValue,
} from '@/lib/bdi-data';
import { FadeIn } from '@/components/ui/animate';

interface CalculadoraPageProps {
  editCalcId?: string | null;
  onSaved?: () => void;
}

export function CalculadoraPage({ editCalcId, onSaved }: CalculadoraPageProps) {
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
  const [iss, setIss] = useState(DEFAULT_BDI_VALUES.iss);

  const [custoDireto, setCustoDireto] = useState('');
  const [saving, setSaving] = useState(false);
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
        if (d?.iss != null) setIss(Number(d.iss));
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
          setIss(c.iss ?? DEFAULT_BDI_VALUES.iss);
          setCustoDireto(c.custoDireto != null ? String(c.custoDireto) : '');
        }
      })
      .catch(() => toast.error('Erro ao carregar cálculo.'))
      .finally(() => setLoadingEdit(false));
  }, [editCalcId]);

  const cprbValue = desoneracao ? (DESONERACAO_RULES[regimeYear]?.cprb ?? 0) : 0;

  const bdiResult = useMemo(() => {
    return calculateBDI({ ac, seguros, riscos, despesasFinanceiras: df, lucro, pis, cofins, iss, cprb: cprbValue });
  }, [ac, seguros, riscos, df, lucro, pis, cofins, iss, cprbValue]);

  const tcuStatus = useMemo(() => getTcuStatus(bdiResult, obraType), [bdiResult, obraType]);
  const statusInfo = getTcuStatusInfo(tcuStatus);
  const limits = TCU_LIMITS[obraType];

  const totalTributos = pis + cofins + iss + cprbValue;
  const custoNum = parseFloat(custoDireto?.replace?.(/[^\d.,]/g, '')?.replace?.(',', '.') ?? '0') || 0;
  const precoVenda = custoNum > 0 ? custoNum * (1 + bdiResult / 100) : 0;

  const handleClear = () => {
    setName(''); setDescription(''); setObraType('edificios');
    setDesoneracao(false); setRegimeYear(2026);
    setAc(DEFAULT_BDI_VALUES.ac); setSeguros(DEFAULT_BDI_VALUES.seguros);
    setRiscos(DEFAULT_BDI_VALUES.riscos); setDf(DEFAULT_BDI_VALUES.despesasFinanceiras);
    setLucro(DEFAULT_BDI_VALUES.lucro); setPis(DEFAULT_BDI_VALUES.pis);
    setCofins(DEFAULT_BDI_VALUES.cofins); setIss(DEFAULT_BDI_VALUES.iss);
    setCustoDireto('');
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome do cálculo.'); return; }
    setSaving(true);
    try {
      const body = {
        name, description, obraType, desoneracao, regimeYear: desoneracao ? regimeYear : null,
        ac, seguros, riscos, despesasFinanceiras: df, lucro, pis, cofins, iss, cprb: cprbValue,
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
      const body = {
        name: name || 'Cálculo BDI', obraType, desoneracao, regimeYear, ac, seguros, riscos,
        despesasFinanceiras: df, lucro, pis, cofins, iss, cprb: cprbValue,
        bdiPercent: bdiResult, custoDireto: custoNum, precoVenda, tcuStatus, totalTributos,
      };
      const createRes = await fetch('/api/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const createData = await createRes.json();
      if (!createData?.request_id) throw new Error(createData?.error ?? 'Erro ao gerar PDF');

      // Poll for status
      let attempts = 0;
      const maxAttempts = 60;
      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch('/api/export/pdf/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: createData.request_id }) });
        const statusData = await statusRes.json();
        if (statusData?.status === 'SUCCESS' && statusData?.pdf_base64) {
          const byteChars = atob(statusData.pdf_base64);
          const byteArray = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `BDI_${name || 'Calculo'}.pdf`; a.click();
          URL.revokeObjectURL(url);
          toast.success('PDF exportado com sucesso!');
          break;
        }
        if (statusData?.status === 'FAILED') throw new Error(statusData?.error ?? 'Falha na geração');
        attempts++;
      }
      if (attempts >= maxAttempts) throw new Error('Timeout ao gerar PDF');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao exportar PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Progress bar position
  const bdiBarPosition = useMemo(() => {
    if (!limits) return 0;
    const maxVal = limits.q3 * 1.3;
    return Math.min(100, Math.max(0, (bdiResult / maxVal) * 100));
  }, [bdiResult, limits]);

  if (loadingEdit) {
    return <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="financial-card h-32 animate-pulse bg-muted" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Seção A - Identificação */}
      <FadeIn>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-primary" /> Identificação do Cálculo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Nome do Cálculo *</label>
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
            <BdiField label="Administração Central (AC)" desc={BDI_RANGES.ac.desc} value={ac} onChange={setAc} min={BDI_RANGES.ac.min} max={BDI_RANGES.ac.max} />
            <BdiField label="Seguros e Garantias (S)" desc={BDI_RANGES.seguros.desc} value={seguros} onChange={setSeguros} min={BDI_RANGES.seguros.min} max={BDI_RANGES.seguros.max} />
            <BdiField label="Riscos (R)" desc={BDI_RANGES.riscos.desc} value={riscos} onChange={setRiscos} min={BDI_RANGES.riscos.min} max={BDI_RANGES.riscos.max} />
            <BdiField label="Despesas Financeiras (DF)" desc={BDI_RANGES.despesasFinanceiras.desc} value={df} onChange={setDf} min={BDI_RANGES.despesasFinanceiras.min} max={BDI_RANGES.despesasFinanceiras.max} />
            <BdiField label="Lucro (L)" desc={BDI_RANGES.lucro.desc} value={lucro} onChange={setLucro} min={BDI_RANGES.lucro.min} max={BDI_RANGES.lucro.max} />

            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tributos</p>
              <div className="space-y-4">
                <BdiField label="PIS" desc={BDI_RANGES.pis.desc} value={pis} onChange={setPis} min={0.65} max={0.65} />
                <BdiField label="COFINS" desc={BDI_RANGES.cofins.desc} value={cofins} onChange={setCofins} min={3} max={3} />
                <BdiField label="ISS" desc={BDI_RANGES.iss.desc} value={iss} onChange={setIss} min={BDI_RANGES.iss.min} max={BDI_RANGES.iss.max} />
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

      {/* Seção D - Custo Direto e Resultado */}
      <FadeIn delay={0.15}>
        <div className="financial-card">
          <h3 className="text-base font-semibold text-foreground mb-4">Custo Direto e Resultado</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Custo Direto (R$)</label>
              <input
                type="text" value={custoDireto}
                onChange={(e) => setCustoDireto(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0,00"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">BDI Calculado</p>
              <p className="text-3xl font-bold text-primary">{formatPercent(bdiResult)}</p>
            </div>
            <div className="bg-success/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Preço de Venda</p>
              <p className="text-2xl font-bold text-success">{custoNum > 0 ? formatCurrency(precoVenda) : '—'}</p>
            </div>
            <div className="bg-warning/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Tributos no BDI</p>
              <p className="text-2xl font-bold text-warning">{formatPercent(totalTributos)}</p>
            </div>
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
          <div className={`rounded-xl p-4 ${statusInfo?.bg} mb-4`}>
            <p className={`text-lg font-bold ${statusInfo?.color}`}>{statusInfo?.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {OBRA_TYPES.find((o) => o.value === obraType)?.label} — Q1: {formatPercent(limits?.q1)} | Médio: {formatPercent(limits?.medio)} | Q3: {formatPercent(limits?.q3)}
            </p>
          </div>

          {/* Barra visual */}
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-green-200" style={{ width: `${(limits?.q1 ?? 0) / (limits?.q3 ?? 1) / 1.3 * 100}%` }} />
            <div className="absolute inset-y-0 bg-blue-200" style={{ left: `${(limits?.q1 ?? 0) / (limits?.q3 ?? 1) / 1.3 * 100}%`, width: `${((limits?.medio ?? 0) - (limits?.q1 ?? 0)) / (limits?.q3 ?? 1) / 1.3 * 100}%` }} />
            <div className="absolute inset-y-0 bg-yellow-200" style={{ left: `${(limits?.medio ?? 0) / (limits?.q3 ?? 1) / 1.3 * 100}%`, width: `${((limits?.q3 ?? 0) - (limits?.medio ?? 0)) / (limits?.q3 ?? 1) / 1.3 * 100}%` }} />
            <div className="absolute inset-y-0 right-0 bg-red-200" style={{ width: `${100 - (limits?.q3 ?? 0) / (limits?.q3 ?? 1) / 1.3 * 100}%` }} />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
              style={{ left: `${bdiBarPosition}%` }}
            >
              <div className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold text-foreground whitespace-nowrap">
                {formatPercent(bdiResult)}
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-green-600">Q1</span>
            <span className="text-[10px] text-blue-600">Médio</span>
            <span className="text-[10px] text-yellow-600">Q3</span>
            <span className="text-[10px] text-red-600">Acima</span>
          </div>
          {tcuStatus === 'acima_q3' && (
            <p className="text-xs text-destructive mt-3 font-medium">
              ⚠ BDI acima do 3º quartil exige justificativa fundamentada conforme Acórdão 2622/2013 do TCU.
            </p>
          )}
        </div>
      </FadeIn>

      {/* Botões */}
      <div className="flex flex-wrap gap-3">
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
  );
}

function BdiField({ label, desc, value, onChange, min, max }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number" step="0.01" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-24 h-9 px-2 text-right rounded-lg border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
        />
        <span className="text-xs text-muted-foreground">%</span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline">
          ({formatPercent(min)} – {formatPercent(max)})
        </span>
      </div>
    </div>
  );
}
