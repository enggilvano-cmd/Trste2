// Relatório PDF do cálculo de BDI, gerado no navegador (jsPDF) — sem serviço externo.
// Usa só caracteres Latin-1 (fonte Helvetica padrão do PDF): nada de travessões ou sinais tipográficos.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OBRA_TYPES, TCU_LIMITS, TCU_COMPONENT_RANGES, DESONERACAO_RULES, getTcuStatusInfo, type ComponentKey, type Quartis, type ObraTypeValue } from '@/lib/bdi-data';

export interface BdiPdfData {
  name: string;
  description?: string;
  obraType: ObraTypeValue;
  desoneracao: boolean;
  regimeYear: number;
  ac: number; seguros: number; riscos: number; despesasFinanceiras: number; lucro: number;
  pis: number; cofins: number; issAliquota: number; issBase: number; iss: number; cprb: number;
  bdi: number; custoDireto: number; precoVenda: number; totalTributos: number;
  tcuStatus: string;
  limits: Quartis;          // faixas usadas (já ajustadas pela CPRB, se houver)
  author?: string | null;
}

const BLUE: [number, number, number] = [23, 110, 181];
const GRAY: [number, number, number] = [113, 128, 150];
const DARK: [number, number, number] = [26, 32, 44];
const LINE: [number, number, number] = [225, 231, 239];
const ZONE = {
  abaixo_q1: { label: 'Abaixo do 1º quartil', fill: [253, 215, 170] as const, text: [221, 107, 32] as const },
  entre_q1_medio: { label: 'Entre o 1º quartil e o médio', fill: [147, 187, 245] as const, text: [37, 99, 235] as const },
  entre_medio_q3: { label: 'Entre o médio e o 3º quartil', fill: [250, 214, 102] as const, text: [180, 120, 0] as const },
  acima_q3: { label: 'Acima do 3º quartil', fill: [245, 178, 178] as const, text: [220, 38, 38] as const },
};

const pct = (v: number) => `${(Number.isFinite(v) ? v : 0).toFixed(2).replace('.', ',')}%`;
const pp = (v: number) => `${Math.abs(v).toFixed(2).replace('.', ',')} p.p.`;
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function buildBdiPdf(d: BdiPdfData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 15; // margem
  const obraLabel = OBRA_TYPES.find((o) => o.value === d.obraType)?.label ?? d.obraType;
  const zone = ZONE[d.tcuStatus as keyof typeof ZONE] ?? ZONE.entre_q1_medio;
  const now = new Date();

  // ── Cabeçalho
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('BDI Calc Pro', M, 11);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text('Relatório de cálculo de BDI  |  Acórdão TCU 2.622/2013', M, 17.5);
  doc.text(now.toLocaleDateString('pt-BR'), W - M, 11, { align: 'right' });

  let y = 30;
  // quebra de página só quando o bloco que vem a seguir não cabe (rodapé começa em ~282 mm)
  const sectionTitle = (t: string, need = 18) => {
    if (y + need > 280) { doc.addPage(); y = 20; }
    doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
    doc.text(t, M, y);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, y + 1.8, W - M, y + 1.8);
    y += 5;
  };
  const tableDefaults = {
    margin: { left: M, right: M },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.6, textColor: DARK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: [237, 242, 247] as [number, number, number], textColor: [74, 85, 104] as [number, number, number], fontStyle: 'bold' as const },
  };
  const after = () => { y = ((doc as any).lastAutoTable?.finalY ?? y) + 6; };

  // ── Identificação
  sectionTitle('Identificação');
  const ident: string[][] = [
    ['Nome da obra', d.name || 'Cálculo de BDI'],
    ['Tipo de obra', obraLabel],
    ['Regime tributário', d.desoneracao ? `Desoneração da folha (CPRB ${pct(d.cprb)} em ${d.regimeYear})` : 'Sem desoneração da folha'],
  ];
  if (d.description?.trim()) ident.push(['Descrição', d.description.trim()]);
  autoTable(doc, { ...tableDefaults, startY: y, body: ident, theme: 'plain',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42, textColor: GRAY } } });
  after();

  // ── Resultado (3 caixas)
  sectionTitle('Resultado');
  const boxW = (W - 2 * M - 8) / 3;
  const boxes: [string, string, [number, number, number], [number, number, number]][] = [
    ['BDI calculado', pct(d.bdi), [232, 241, 250], BLUE],
    ['Preço de venda', d.custoDireto > 0 ? brl(d.precoVenda) : 'informe o custo direto', [232, 246, 238], [22, 130, 70]],
    ['Tributos no BDI', pct(d.totalTributos), [253, 241, 230], [221, 107, 32]],
  ];
  boxes.forEach(([label, value, bg, fg], i) => {
    const x = M + i * (boxW + 4);
    doc.setFillColor(...bg); doc.roundedRect(x, y, boxW, 16, 2, 2, 'F');
    doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text(label, x + boxW / 2, y + 5.5, { align: 'center' });
    doc.setTextColor(...fg); doc.setFont('helvetica', 'bold');
    doc.setFontSize(value.length > 16 ? 9 : 15);
    doc.text(value, x + boxW / 2, y + 12.5, { align: 'center' });
  });
  y += 20;
  if (d.custoDireto > 0) {
    doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text(`Custo direto: ${brl(d.custoDireto)}   x   (1 + ${pct(d.bdi)})   =   ${brl(d.precoVenda)}`, M, y);
    y += 5;
  }
  y += 3;

  // ── Conformidade TCU
  sectionTitle('Conformidade TCU', 45);
  doc.setTextColor(...(zone.text as unknown as [number, number, number])); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(zone.label, M, y + 2);
  y += 8;
  drawGauge(doc, M, y, W - 2 * M, d.bdi, d.limits, d.tcuStatus);
  y += 26;
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const dist = d.bdi > d.limits.q3 ? `${pp(d.bdi - d.limits.q3)} acima do 3º quartil`
    : d.bdi < d.limits.q1 ? `${pp(d.limits.q1 - d.bdi)} abaixo do 1º quartil`
    : `Margem de ${pp(d.limits.q3 - d.bdi)} até o 3º quartil`;
  doc.text(dist, M, y); y += 5;
  const notes: string[] = ['Faixas do BDI: Acórdão 2.622/2013, item 9.1.'];
  if (d.cprb > 0) {
    const o = TCU_LIMITS[d.obraType];
    notes.push(`Faixas ajustadas pela CPRB de ${pct(d.cprb)} (critério do programa: o Acórdão não publica faixas com desoneração). Originais do Acórdão (sem CPRB): 1º quartil ${pct(o.q1)}, médio ${pct(o.medio)}, 3º quartil ${pct(o.q3)}.`);
  }
  if (d.tcuStatus === 'acima_q3') notes.push('BDI acima do 3º quartil exige justificativa fundamentada, conforme o Acórdão 2.622/2013 do TCU.');
  if (d.tcuStatus === 'abaixo_q1') notes.push('BDI abaixo do 1º quartil, fora da faixa de referência do TCU. Não é irregular por si só, mas convém justificar a composição e verificar a exequibilidade da proposta.');
  doc.setFontSize(8.5); doc.setTextColor(...GRAY);
  for (const n of notes) { const lines = doc.splitTextToSize(n, W - 2 * M); doc.text(lines, M, y); y += lines.length * 4 + 1; }
  y += 3;

  // ── Componentes
  sectionTitle('Componentes do BDI', 50);
  const comp = TCU_COMPONENT_RANGES[d.obraType];
  const rows: [string, number, ComponentKey][] = [
    ['Administração central (AC)', d.ac, 'ac'],
    ['Seguros e garantias (S + G)', d.seguros, 'seguros'],
    ['Riscos (R)', d.riscos, 'riscos'],
    ['Despesas financeiras (DF)', d.despesasFinanceiras, 'despesasFinanceiras'],
    ['Lucro (L)', d.lucro, 'lucro'],
  ];
  autoTable(doc, {
    ...tableDefaults, startY: y,
    head: [['Componente', 'Valor', '1º quartil', 'Médio', '3º quartil', 'Situação']],
    body: rows.map(([label, v, k]) => {
      const r = comp[k];
      const sit = v < r.q1 ? 'Abaixo da faixa' : v > r.q3 ? 'Acima da faixa' : 'Dentro da faixa';
      return [label, pct(v), pct(r.q1), pct(r.medio), pct(r.q3), sit];
    }),
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' } },
    didParseCell: (h) => {
      if (h.section === 'body' && h.column.index === 5) {
        h.cell.styles.textColor = String(h.cell.raw).startsWith('Dentro') ? [22, 130, 70] : [221, 107, 32];
        h.cell.styles.fontStyle = 'bold';
      }
    },
  });
  after();
  doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Faixas de cada parcela por tipo de obra: Acórdão 2.622/2013, item 9.2.1.', M, y - 3);
  y += 4;

  // ── Tributos
  sectionTitle('Tributos', 40);
  const trib: string[][] = [
    ['PIS', pct(d.pis), d.pis === 0.65 ? 'Regime cumulativo (Lei 9.718/1998; Lei 10.833/2003, art. 10, XX)' : 'Percentual efetivo: não cumulativo ou Simples (itens 9.3.2.4 e 9.3.2.5 do Acórdão)'],
    ['COFINS', pct(d.cofins), d.cofins === 3 ? 'Regime cumulativo (Lei 9.718/1998; Lei 10.833/2003, art. 10, XX)' : 'Percentual efetivo: não cumulativo ou Simples (itens 9.3.2.4 e 9.3.2.5 do Acórdão)'],
    ['ISS', pct(d.iss), `Alíquota municipal ${pct(d.issAliquota)} x base de cálculo ${pct(d.issBase)} (item 9.3.2.3)`],
  ];
  if (d.cprb > 0) trib.push(['CPRB', pct(d.cprb), `Desoneração da folha, Lei 14.973/2024 (${d.regimeYear})`]);
  autoTable(doc, {
    ...tableDefaults, startY: y,
    head: [['Tributo', 'Percentual', 'Observação']],
    body: trib,
    foot: [['Total de tributos (T)', pct(d.totalTributos), '']],
    footStyles: { fillColor: [237, 242, 247], textColor: DARK, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 45 }, 1: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } },
  });
  after();

  // ── Fórmula (bloco compacto abaixo dos tributos)
  if (y + 16 > doc.internal.pageSize.getHeight() - 14) { doc.addPage(); y = 20; }
  doc.setFillColor(247, 250, 252); doc.roundedRect(M, y - 2, W - 2 * M, 16, 2, 2, 'F');
  doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text('Fórmula do Acórdão TCU 2.622/2013', M + 4, y + 2.5);
  doc.setTextColor(...DARK); doc.setFont('courier', 'bold'); doc.setFontSize(9.5);
  doc.text('BDI = [ (1 + AC + S + R + G) x (1 + DF) x (1 + L) / (1 - T) ] - 1', M + 4, y + 7.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
  doc.text('T = PIS + COFINS + ISS + CPRB (se houver desoneração). O BDI é aplicado sobre o custo direto para obter o preço de venda.', M + 4, y + 12);

  y += 20;

  // ── Verificações fora do relatório (o que o cálculo não comprova sozinho)
  const cpp = DESONERACAO_RULES[d.regimeYear]?.cpp;
  const checks: string[] = [
    `ISS: anexar a lei municipal que fixa a alíquota de ${pct(d.issAliquota)} e a base de cálculo de ${pct(d.issBase)} (item 9.3.2.3).`,
    'Custo direto: confirmar que administração local, canteiro, mobilização e demais itens do art. 9º do Decreto 7.983/2013 estão na planilha de custo direto; IRPJ e CSLL ficam fora do BDI (Súmula TCU 254).',
  ];
  if (!(d.custoDireto > 0)) checks.push('Informar o custo direto para que o relatório mostre o preço de venda.');
  if (d.desoneracao) {
    checks.push(`Regime desonerado: o custo direto deve usar referência desonerada e incluir nos encargos sociais a contribuição de ${cpp ?? '-'}% sobre a folha devida em ${d.regimeYear}.`);
    checks.push('Juntar o comparativo onerado x desonerado e a declaração de que a opção adotada é a mais vantajosa.');
  }
  checks.push('Execução a partir de 2027: a CPRB cai para 1,80% e a CBS substitui o PIS/COFINS (LC 214/2025); prever BDI por exercício ou cláusula de reequilíbrio.');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); // mede as linhas na mesma fonte em que serão desenhadas
  const linesOf = checks.map((c) => doc.splitTextToSize(c, W - 2 * M - 6) as string[]);
  const need = 10 + linesOf.reduce((a, l) => a + l.length * 3.8 + 1.2, 0) + 8;
  sectionTitle('Verificações fora do relatório', Math.min(need, 120));
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  for (const lines of linesOf) {
    if (y + lines.length * 3.8 > doc.internal.pageSize.getHeight() - 16) { doc.addPage(); y = 20; }
    doc.setDrawColor(...GRAY); doc.setLineWidth(0.3); doc.rect(M, y - 2.6, 2.8, 2.8);
    doc.setTextColor(...DARK); doc.text(lines, M + 6, y);
    y += lines.length * 3.8 + 1.2;
  }
  y += 2;
  doc.setFontSize(7.5); doc.setTextColor(...GRAY);
  doc.text(doc.splitTextToSize('Fundamentação: Acórdão TCU 2.622/2013-Plenário (itens 9.1, 9.2.1 e 9.3.2); Decreto 7.983/2013, art. 9º; Súmulas TCU 254 e 258; Lei 12.546/2011 e Lei 14.973/2024 (CPRB); Lei 9.718/1998 e Lei 10.833/2003 (PIS/COFINS); LC 116/2003 (ISS); EC 132/2023 e LC 214/2025 (reforma tributária).', W - 2 * M), M, y);

  // ── Rodapé em todas as páginas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...LINE); doc.line(M, H - 12, W - M, H - 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(160, 174, 192);
    doc.text(`Gerado por BDI Calc Pro em ${now.toLocaleString('pt-BR')}${d.author ? ` por ${d.author}` : ''}`, M, H - 7);
    doc.text(`Página ${i} de ${pages}`, W - M, H - 7, { align: 'right' });
  }
  return doc;
}

/** Régua de conformidade (mesma lógica de escala da tela). */
function drawGauge(doc: jsPDF, x: number, y: number, w: number, bdi: number, l: Quartis, status: string) {
  const span = Math.max(l.q3 - l.q1, 0.5);
  const lo = Math.max(0, Math.max(l.q1 - span * 1.2, Math.min(l.q1 - span * 0.6, bdi - span * 0.2)));
  const hi = Math.min(l.q3 + span * 1.2, Math.max(l.q3 + span * 0.6, bdi + span * 0.2));
  const px = (v: number) => x + Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * w;
  const barY = y + 7, barH = 5;
  const segs: [number, number, readonly number[]][] = [
    [x, px(l.q1), ZONE.abaixo_q1.fill], [px(l.q1), px(l.medio), ZONE.entre_q1_medio.fill],
    [px(l.medio), px(l.q3), ZONE.entre_medio_q3.fill], [px(l.q3), x + w, ZONE.acima_q3.fill],
  ];
  for (const [a, b, c] of segs) { doc.setFillColor(c[0], c[1], c[2]); doc.rect(a, barY, Math.max(0, b - a), barH, 'F'); }
  // marcador e selo do BDI
  const mx = px(bdi);
  const zone = ZONE[status as keyof typeof ZONE] ?? ZONE.entre_q1_medio;
  doc.setFillColor(...DARK); doc.rect(mx - 0.5, barY - 1.5, 1, barH + 3, 'F');
  const label = `BDI ${pct(bdi)}${bdi > hi ? ' >' : bdi < lo ? ' <' : ''}`;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  const lw = doc.getTextWidth(label) + 5;
  const lx = Math.min(x + w - lw, Math.max(x, mx - lw / 2));
  doc.setFillColor(zone.text[0], zone.text[1], zone.text[2]); doc.roundedRect(lx, y, lw, 5.2, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255); doc.text(label, lx + lw / 2, y + 3.7, { align: 'center' });
  // quartis
  doc.setFontSize(7.5);
  for (const [t, v] of [['1º quartil', l.q1], ['Médio', l.medio], ['3º quartil', l.q3]] as const) {
    const tx = px(v);
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.4); doc.line(tx, barY, tx, barY + barH);
    doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.text(t, tx, barY + barH + 4, { align: 'center' });
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.text(pct(v), tx, barY + barH + 8, { align: 'center' });
  }
}

/** Gera e baixa o PDF. */
export function downloadBdiPdf(d: BdiPdfData) {
  const doc = buildBdiPdf(d);
  const safe = (d.name || 'Calculo').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80) || 'Calculo';
  doc.save(`BDI_${safe}.pdf`);
}
