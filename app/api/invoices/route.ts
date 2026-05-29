import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const status = searchParams.get('status')
  const customerId = searchParams.get('customer')

  let query = db
    .from('Invoice')
    .select('*, Customer(id, code, name), Payment(count)')
    .order('createdAt', { ascending: false })

  if (status) query = query.eq('status', status)
  if (customerId) query = query.eq('customerId', customerId)
  if (q) query = query.or(`invoiceNumber.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let invoices = (data ?? []).map(({ Customer: customer, Payment: p, ...inv }: any) => ({
    ...inv,
    customer,
    _count: { payments: (p as Array<{ count: number }>)?.[0]?.count ?? 0 },
  }))

  // client-side filter for customer name/code search (PostgREST can't filter on joined table columns easily)
  if (q) {
    const lower = q.toLowerCase()
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(lower) ||
        inv.customer?.name?.toLowerCase().includes(lower) ||
        inv.customer?.code?.toLowerCase().includes(lower)
    )
  }

  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { customerId, issueDate, dueDate, notes, items, discountPct } = body

  if (!customerId || !dueDate || !items?.length)
    return NextResponse.json({ error: 'Customer, due date, and at least one item are required' }, { status: 400 })

  const { data: settings } = await db.from('Settings').select('invoicePrefix, invoiceNextNumber').eq('id', 'singleton').single()
  const prefix = settings?.invoicePrefix ?? 'INV'
  const nextNum = settings?.invoiceNextNumber ?? 1
  const invoiceNumber = `${prefix}${String(nextNum).padStart(5, '0')}`

  const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number; discountPct: number }) => {
    const lineTotal = item.quantity * item.unitPrice
    return sum + lineTotal - lineTotal * ((item.discountPct ?? 0) / 100)
  }, 0)

  const discPct = Number(discountPct) || 0
  const discountAmt = subtotal * (discPct / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = items.reduce((sum: number, item: { quantity: number; unitPrice: number; discountPct: number; taxPct: number }) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineNet = lineTotal - lineTotal * ((item.discountPct ?? 0) / 100)
    return sum + lineNet * ((item.taxPct ?? 0) / 100)
  }, 0)
  const total = afterDiscount + taxAmt

  const invoiceId = crypto.randomUUID()

  const { data: invoice, error: invErr } = await db
    .from('Invoice')
    .insert({
      id: invoiceId,
      invoiceNumber,
      customerId,
      issueDate: issueDate || new Date().toISOString(),
      dueDate,
      notes,
      subtotal,
      discountPct: discPct,
      discountAmt,
      taxAmt,
      taxPct: 0,
      total,
      amountPaid: 0,
      balance: total,
    })
    .select()
    .single()
  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  const invoiceItems = items.map((item: {
    code?: string; description: string; quantity: number; unit?: string
    unitPrice: number; discountPct?: number; taxPct?: number
  }) => ({
    id: crypto.randomUUID(),
    invoiceId,
    code: item.code,
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    discountPct: Number(item.discountPct ?? 0),
    taxPct: Number(item.taxPct ?? 0),
    nettPrice: Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discountPct ?? 0) / 100),
  }))

  const { data: itemsData, error: itemsErr } = await db.from('InvoiceItem').insert(invoiceItems).select()
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  await db.from('Settings').update({ invoiceNextNumber: nextNum + 1 }).eq('id', 'singleton')

  const { data: customer } = await db.from('Customer').select('*').eq('id', customerId).single()

  return NextResponse.json({ ...invoice, customer, items: itemsData }, { status: 201 })
}
