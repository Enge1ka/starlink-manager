import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [{ data: invoice }, { data: customer }, { data: items }, { data: payments }] = await Promise.all([
    db.from('Invoice').select('*').eq('id', id).single(),
    db.from('Invoice').select('Customer(*)').eq('id', id).single(),
    db.from('InvoiceItem').select('*').eq('invoiceId', id),
    db.from('Payment').select('*').eq('invoiceId', id).order('paymentDate', { ascending: false }),
  ])

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json({ ...invoice, customer: (customer as any)?.Customer, items, payments })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const { status, notes, dueDate } = body

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (notes !== undefined) updates.notes = notes
  if (dueDate) updates.dueDate = dueDate

  const { data: invoice, error } = await db.from('Invoice').update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [{ data: customer }, { data: items }, { data: payments }] = await Promise.all([
    db.from('Customer').select('*').eq('id', invoice.customerId).single(),
    db.from('InvoiceItem').select('*').eq('invoiceId', id),
    db.from('Payment').select('*').eq('invoiceId', id).order('paymentDate', { ascending: false }),
  ])

  return NextResponse.json({ ...invoice, customer, items, payments })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // Delete payments first (no cascade), then items (cascade handles it), then invoice
  await db.from('Payment').delete().eq('invoiceId', id)
  const { error } = await db.from('Invoice').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
