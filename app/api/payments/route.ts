import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('invoice')

  let query = db
    .from('Payment')
    .select('*, Invoice(id, invoiceNumber, Customer(id, code, name))')
    .order('paymentDate', { ascending: false })

  if (invoiceId) query = query.eq('invoiceId', invoiceId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = (data ?? []).map(({ Invoice: inv, ...p }: any) => ({
    ...p,
    invoice: { ...inv, customer: inv?.Customer },
  }))

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { invoiceId, amount, paymentDate, method, reference, notes } = body

  if (!invoiceId || !amount)
    return NextResponse.json({ error: 'Invoice and amount are required' }, { status: 400 })

  const { data: invoice } = await db.from('Invoice').select('id, total, status').eq('id', invoiceId).single()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const { data: payment, error: payErr } = await db
    .from('Payment')
    .insert({
      id: crypto.randomUUID(),
      invoiceId,
      amount: Number(amount),
      paymentDate: paymentDate || new Date().toISOString(),
      method,
      reference,
      notes,
    })
    .select()
    .single()
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  const { data: allPayments } = await db.from('Payment').select('amount').eq('invoiceId', invoiceId)
  const amountPaid = (allPayments ?? []).reduce((s, p) => s + p.amount, 0)
  const balance = invoice.total - amountPaid

  let status = invoice.status
  if (balance <= 0) status = 'Paid'
  else if (amountPaid > 0) status = 'PartiallyPaid'

  await db.from('Invoice').update({ amountPaid, balance: Math.max(0, balance), status }).eq('id', invoiceId)

  return NextResponse.json(payment, { status: 201 })
}
