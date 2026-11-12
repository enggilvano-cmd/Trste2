export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { request_id } = await request.json();
    const statusRes = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
      body: JSON.stringify({ request_id }),
    });
    const statusResult = await statusRes.json();
    const status = statusResult?.status || 'FAILED';
    const result = statusResult?.result || null;

    if (status === 'SUCCESS' && result?.result) {
      return NextResponse.json({ status, pdf_base64: result.result });
    }
    if (status === 'FAILED') {
      return NextResponse.json({ status, error: result?.error || 'Falha' });
    }
    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('PDF status error:', error);
    return NextResponse.json({ status: 'FAILED', error: 'Erro ao verificar status' }, { status: 500 });
  }
}
