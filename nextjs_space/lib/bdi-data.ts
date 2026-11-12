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
  seguros: { min: 0.09, max: 0.42, label: 'Seguros e Garantias', desc: 'Custos com seguros e garantias contratuais' },
  riscos: { min: 0.97, max: 2.26, label: 'Riscos', desc: 'Margem para riscos e imprevistos na execução' },
  despesasFinanceiras: { min: 0.70, max: 1.20, label: 'Despesas Financeiras', desc: 'Custos com capital de giro e financiamento' },
  lucro: { min: 6.16, max: 8.96, label: 'Lucro', desc: 'Margem de lucro bruto da empresa' },
  pis: { min: 0.65, max: 0.65, label: 'PIS', desc: 'Programa de Integração Social' },
  cofins: { min: 3.00, max: 3.00, label: 'COFINS', desc: 'Contribuição para Financiamento da Seguridade Social' },
  iss: { min: 3.00, max: 5.00, label: 'ISS', desc: 'Imposto Sobre Serviços' },
};

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
  const bdi = (
    ((1 + ac / 100) * (1 + (seguros + riscos) / 100) * (1 + despesasFinanceiras / 100) * (1 + lucro / 100))
    / (1 - T / 100)
  ) - 1;
  return bdi * 100;
}

export function getTcuStatus(bdiPercent: number, obraType: ObraTypeValue): string {
  const limits = TCU_LIMITS[obraType];
  if (!limits) return 'dentro_q1';
  if (bdiPercent <= limits.q1) return 'dentro_q1';
  if (bdiPercent <= limits.medio) return 'entre_q1_medio';
  if (bdiPercent <= limits.q3) return 'entre_medio_q3';
  return 'acima_q3';
}

export function getTcuStatusInfo(status: string) {
  switch (status) {
    case 'dentro_q1': return { label: '✓ Dentro do 1º Quartil', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', badgeBg: 'bg-green-100 text-green-700' };
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
