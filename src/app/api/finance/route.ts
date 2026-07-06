import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const invoices = await db.getDidoxInvoices();
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch Didox invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { supplier_name, item_name, price, qty, avg_historic_price } = body;

    if (!supplier_name || !item_name || !price || !qty || !avg_historic_price) {
      return NextResponse.json({ error: 'Missing required invoice fields' }, { status: 400 });
    }

    const ratio = price / avg_historic_price;
    let flagged_reason = null;
    if (ratio >= 1.5) {
      flagged_reason = `Цена завышена в ${ratio.toFixed(1)} раз(а) по сравнению со средней ценой (${avg_historic_price.toLocaleString()} сум)! Поставщик ${supplier_name} зафиксирован с завышением.`;
    }

    const newInvoice = await db.createDidoxInvoice({
      supplier_name,
      item_name,
      price: Number(price),
      qty: Number(qty),
      avg_historic_price: Number(avg_historic_price),
      flagged_reason
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create Didox invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
