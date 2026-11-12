export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OBRA_TYPES, getTcuStatusInfo, formatPercent, formatCurrency } from '@/lib/bdi-data';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const obraLabel = OBRA_TYPES.find((o) => o.value === body?.obraType)?.label ?? body?.obraType ?? '';
    const statusInfo = getTcuStatusInfo(body?.tcuStatus);

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
      body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px;color:#1a202c;font-size:14px}
      h1{color:#176EB5;font-size:24px;margin-bottom:4px}
      .subtitle{color:#718096;font-size:12px;margin-bottom:24px}
      .section{margin-bottom:20px;border:1px solid #E1E7EF;border-radius:8px;padding:16px}
      .section-title{font-weight:700;font-size:14px;margin-bottom:12px;color:#176EB5}
      table{width:100%;border-collapse:collapse}
      th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E1E7EF;font-size:12px}
      th{background:#EDF2F7;font-weight:600;color:#4A5568}
      .result-box{background:#EDF2F7;border-radius:8px;padding:16px;text-align:center;margin:8px 0}
      .result-value{font-size:28px;font-weight:800;color:#176EB5}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #E1E7EF;font-size:10px;color:#A0AEC0}
      .status{display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600}
    </style></head><body>
      <h1>BDI Calc Pro</h1>
      <p class="subtitle">Relatório de Cálculo de BDI — ${new Date().toLocaleDateString('pt-BR')}</p>
      <div class="section">
        <div class="section-title">Identificação</div>
        <table><tbody>
          <tr><td><strong>Nome:</strong></td><td>${body?.name ?? ''}</td></tr>
          <tr><td><strong>Tipo de Obra:</strong></td><td>${obraLabel}</td></tr>
          <tr><td><strong>Desoneração:</strong></td><td>${body?.desoneracao ? 'Sim — Ano ' + (body?.regimeYear ?? '') : 'Não'}</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Componentes do BDI</div>
        <table><thead><tr><th>Componente</th><th>Valor</th></tr></thead><tbody>
          <tr><td>Administração Central (AC)</td><td>${formatPercent(body?.ac)}</td></tr>
          <tr><td>Seguros e Garantias (S)</td><td>${formatPercent(body?.seguros)}</td></tr>
          <tr><td>Riscos (R)</td><td>${formatPercent(body?.riscos)}</td></tr>
          <tr><td>Despesas Financeiras (DF)</td><td>${formatPercent(body?.despesasFinanceiras)}</td></tr>
          <tr><td>Lucro (L)</td><td>${formatPercent(body?.lucro)}</td></tr>
          <tr><td>PIS</td><td>${formatPercent(body?.pis)}</td></tr>
          <tr><td>COFINS</td><td>${formatPercent(body?.cofins)}</td></tr>
          <tr><td>ISS</td><td>${formatPercent(body?.iss)}</td></tr>
          ${body?.desoneracao ? `<tr><td>CPRB</td><td>${formatPercent(body?.cprb)}</td></tr>` : ''}
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Resultado</div>
        <div class="result-box"><div class="result-value">${formatPercent(body?.bdiPercent)}</div><div style="font-size:11px;color:#718096">BDI Calculado</div></div>
        <table><tbody>
          <tr><td><strong>Custo Direto:</strong></td><td>${body?.custoDireto ? formatCurrency(body.custoDireto) : '—'}</td></tr>
          <tr><td><strong>Preço de Venda:</strong></td><td>${body?.precoVenda ? formatCurrency(body.precoVenda) : '—'}</td></tr>
          <tr><td><strong>Tributos totais:</strong></td><td>${formatPercent(body?.totalTributos)}</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Conformidade TCU</div>
        <p><span class="status" style="background:#EDF2F7">${statusInfo?.label}</span></p>
        <p style="font-size:11px;color:#718096;margin-top:8px">${obraLabel}</p>
      </div>
      <div class="footer">Gerado por BDI Calc Pro — ${session?.user?.name ?? 'Usuário'} — ${new Date().toLocaleString('pt-BR')}</div>
    </body></html>`;

    const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
      body: JSON.stringify({ html_content: html, pdf_options: { format: 'A4', print_background: true } }),
    });
    const { request_id } = await createRes.json();
    if (!request_id) return NextResponse.json({ error: 'Falha ao criar PDF' }, { status: 500 });
    return NextResponse.json({ success: true, request_id });
  } catch (error: any) {
    console.error('PDF error:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}
