export const OBRA_TYPES = [
  { value: 'edificios', label: 'Construção de Edifícios' },
  { value: 'rodovias', label: 'Construção de Rodovias e Ferrovias' },
  { value: 'saneamento', label: 'Redes de Abastecimento de Água, Esgoto e Correlatas' },
  { value: 'energia', label: 'Construção/Manutenção de Redes de Energia Elétrica' },
  { value: 'portuarias', label: 'Obras Portuárias, Marítimas e Fluviais' },
  { value: 'fornecimento', label: 'Itens de Mero Fornecimento de Materiais e Equipamentos' },
] as const;

export type ObraTypeValue = typeof OBRA_TYPES[number]['value'];

export const TCU_LIMITS: Record<ObraTypeValue, { q1: number; medio: number; q3: number }> = {
  edificios: { q1: 20.34, medio: 22.12, q3: 25.00 },
  rodovias: { q1: 19.60, medio: 20.97, q3: 24.23 },
  saneamento: { q1: 20.76, medio: 24.18, q3: 26.44 },
  energia: { q1: 24.00, medio: 25.84, q3: 27.86 },
  portuarias: { q1: 22.80, medio: 27.48, q3: 30.95 },
  fornecimento: { q1: 11.10, medio: 14.02, q3: 16.80 },
};

export const DESONERACAO_RULES: Record<number, { cprb: number; cpp: number; label: string }> = {
  2025: { cprb: 3.6, cpp: 5, label: '2025 — CPRB 3,6% (80% de 4,5%) / CPP Folha 5%' },
  2026: { cprb: 2.7, cpp: 10, label: '2026 — CPRB 2,7% (60% de 4,5%) / CPP Folha 10%' },
  2027: { cprb: 1.8, cpp: 15, label: '2027 — CPRB 1,8% (40% de 4,5%) / CPP Folha 15%' },
};

export const DEFAULT_BDI_VALUES = {
  ac: 4.00,
  seguros: 0.20,
  riscos: 1.50,
  despesasFinanceiras: 0.90,
  lucro: 7.50,
  pis: 0.65,
  cofins: 3.00,
  iss: 3.00,
};

export const BDI_RANGES: Record<string, { min: number; max: number; label: string; desc: string }> = {
  ac: { min: 3.00, max: 5.50, label: 'Administração Central', desc: 'Custos da administração central da empresa (rateio)' },
  seguros: { min: 0.80, max: 1.00, label: 'Seguros e Garantias', desc: 'Custos com seguros e garantias contratuais' },
  riscos: { min: 0.97, max: 1.27, label: 'Riscos', desc: 'Margem para riscos e imprevistos na execução' },
  despesasFinanceiras: { min: 0.59, max: 1.39, label: 'Despesas Financeiras', desc: 'Custos com capital de giro e financiamento' },
  lucro: { min: 6.16, max: 8.96, label: 'Lucro', desc: 'Margem de lucro bruto da empresa' },
  pis: { min: 0.65, max: 0.65, label: 'PIS', desc: 'Regime cumulativo de obras: 0,65% (Lei 9.718/1998; Lei 10.833/2003, art. 10, XX). Não cumulativo ou Simples: informe o percentual efetivo (Acórdão 2.622/2013, itens 9.3.2.4 e 9.3.2.5)' },
  cofins: { min: 3.00, max: 3.00, label: 'COFINS', desc: 'Regime cumulativo de obras: 3,00% (Lei 9.718/1998; Lei 10.833/2003, art. 10, XX). Não cumulativo ou Simples: informe o percentual efetivo (Acórdão 2.622/2013, itens 9.3.2.4 e 9.3.2.5)' },
  iss: { min: 0, max: 5.00, label: 'ISS', desc: 'Alíquota municipal (2% a 5%) aplicada sobre a base de cálculo definida na lei do município' },
};

export type ComponentKey = 'ac' | 'seguros' | 'riscos' | 'despesasFinanceiras' | 'lucro';
export type Quartis = { q1: number; medio: number; q3: number };

/**
 * Faixas de cada parcela do BDI por tipo de obra — Acórdão 2622/2013-TCU-Plenário, item 9.2.1
 * (conferido no texto oficial, código de autenticidade TCU 50445565).
 * "seguros" corresponde a Seguro + Garantia (S + G).
 */
export const TCU_COMPONENT_RANGES: Record<ObraTypeValue, Record<ComponentKey, Quartis>> = {
  edificios: {
    ac: { q1: 3.00, medio: 4.00, q3: 5.50 },
    seguros: { q1: 0.80, medio: 0.80, q3: 1.00 },
    riscos: { q1: 0.97, medio: 1.27, q3: 1.27 },
    despesasFinanceiras: { q1: 0.59, medio: 1.23, q3: 1.39 },
    lucro: { q1: 6.16, medio: 7.40, q3: 8.96 },
  },
  rodovias: {
    ac: { q1: 3.80, medio: 4.01, q3: 4.67 },
    seguros: { q1: 0.32, medio: 0.40, q3: 0.74 },
    riscos: { q1: 0.50, medio: 0.56, q3: 0.97 },
    despesasFinanceiras: { q1: 1.02, medio: 1.11, q3: 1.21 },
    lucro: { q1: 6.64, medio: 7.30, q3: 8.69 },
  },
  saneamento: {
    ac: { q1: 3.43, medio: 4.93, q3: 6.71 },
    seguros: { q1: 0.28, medio: 0.49, q3: 0.75 },
    riscos: { q1: 1.00, medio: 1.39, q3: 1.74 },
    despesasFinanceiras: { q1: 0.94, medio: 0.99, q3: 1.17 },
    lucro: { q1: 6.74, medio: 8.04, q3: 9.40 },
  },
  energia: {
    ac: { q1: 5.29, medio: 5.92, q3: 7.93 },
    seguros: { q1: 0.25, medio: 0.51, q3: 0.56 },
    riscos: { q1: 1.00, medio: 1.48, q3: 1.97 },
    despesasFinanceiras: { q1: 1.01, medio: 1.07, q3: 1.11 },
    lucro: { q1: 8.00, medio: 8.31, q3: 9.51 },
  },
  portuarias: {
    ac: { q1: 4.00, medio: 5.52, q3: 7.85 },
    seguros: { q1: 0.81, medio: 1.22, q3: 1.99 },
    riscos: { q1: 1.46, medio: 2.32, q3: 3.16 },
    despesasFinanceiras: { q1: 0.94, medio: 1.02, q3: 1.33 },
    lucro: { q1: 7.14, medio: 8.40, q3: 10.43 },
  },
  fornecimento: {
    ac: { q1: 1.50, medio: 3.45, q3: 4.49 },
    seguros: { q1: 0.30, medio: 0.48, q3: 0.82 },
    riscos: { q1: 0.56, medio: 0.85, q3: 0.89 },
    despesasFinanceiras: { q1: 0.85, medio: 0.85, q3: 1.11 },
    lucro: { q1: 3.50, medio: 5.11, q3: 6.22 },
  },
};

/** ISS limites constitucionais/legais (Acórdão 2622/2013, item 9.3.2.3: LC 116/2003 art. 8º, II e ADCT art. 88). */
export const ISS_ALIQUOTA_MIN = 2;
export const ISS_ALIQUOTA_MAX = 5;

/** ISS efetivo no BDI = alíquota municipal × base de cálculo (% do preço sujeito ao imposto, conforme lei municipal). */
export function calcIssEfetivo(aliquota: number, basePercent: number): number {
  return Math.round(aliquota * basePercent * 100) / 10000; // ex.: 5% × 60% = 3,00% (4 casas)
}

export function calculateBDI(params: {
  ac: number;
  seguros: number;
  riscos: number;
  despesasFinanceiras: number;
  lucro: number;
  pis: number;
  cofins: number;
  iss: number;
  cprb: number;
}) {
  const { ac, seguros, riscos, despesasFinanceiras, lucro, pis, cofins, iss, cprb } = params;
  const T = pis + cofins + iss + cprb;
  if (T >= 100) return 0;
  // Fórmula do TCU (Acórdão 2622/2013): AC, S, R e G somados no mesmo fator.
  // BDI = [(1 + AC + S + R + G) × (1 + DF) × (1 + L) / (1 − I)] − 1
  const bdi = (
    ((1 + (ac + seguros + riscos) / 100) * (1 + despesasFinanceiras / 100) * (1 + lucro / 100))
    / (1 - T / 100)
  ) - 1;
  return bdi * 100;
}

export type TcuLimits = { q1: number; medio: number; q3: number };

/**
 * Faixas do TCU ajustadas para a CPRB.
 * Os quartis do Acórdão 2622/2013 foram calculados sem a CPRB. Quando há desoneração,
 * a CPRB entra no divisor (1 − I) e eleva o BDI; cada limite é corrigido pelo mesmo fator:
 * limite_ajustado = (1 + limite) × (1 − I₀) / (1 − I₀ − CPRB) − 1,
 * onde I₀ = PIS + COFINS + ISS. Sem CPRB, devolve as faixas originais.
 */
export function getTcuLimits(obraType: ObraTypeValue, cprb = 0, outrosTributos = 0): TcuLimits | undefined {
  const base = TCU_LIMITS[obraType];
  if (!base || !cprb) return base;
  const i0 = outrosTributos / 100;
  const fator = (1 - i0) / (1 - i0 - cprb / 100);
  if (!(fator > 0) || !Number.isFinite(fator)) return base;
  const adj = (x: number) => ((1 + x / 100) * fator - 1) * 100;
  return { q1: adj(base.q1), medio: adj(base.medio), q3: adj(base.q3) };
}

export function getTcuStatus(bdiPercent: number, obraType: ObraTypeValue, limits?: TcuLimits): string {
  const l = limits ?? TCU_LIMITS[obraType];
  if (!l) return 'abaixo_q1';
  if (bdiPercent < l.q1) return 'abaixo_q1';
  if (bdiPercent <= l.medio) return 'entre_q1_medio';
  if (bdiPercent <= l.q3) return 'entre_medio_q3';
  return 'acima_q3';
}

export function getTcuStatusInfo(status: string) {
  switch (status) {
    case 'abaixo_q1': return { label: '⚠ Abaixo do 1º Quartil', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badgeBg: 'bg-orange-100 text-orange-700' };
    // Status gravado por versões antigas (BDI ≤ Q1), mantido para exibir cálculos já salvos.
    case 'dentro_q1': return { label: '⚠ Até o 1º Quartil (cálculo antigo)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badgeBg: 'bg-orange-100 text-orange-700' };
    case 'entre_q1_medio': return { label: '✓ Entre Q1 e Médio', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badgeBg: 'bg-blue-100 text-blue-700' };
    case 'entre_medio_q3': return { label: '⚠ Entre Médio e Q3', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', badgeBg: 'bg-yellow-100 text-yellow-700' };
    case 'acima_q3': return { label: '✗ Acima do 3º Quartil', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badgeBg: 'bg-red-100 text-red-700' };
    default: return { label: 'N/A', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', badgeBg: 'bg-gray-100 text-gray-700' };
  }
}

export function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

export function formatPercent(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0) + '%';
}
