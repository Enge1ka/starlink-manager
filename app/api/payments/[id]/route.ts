import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: payment } = await db.from('Payment').select('invoiceId').eq('id', id).single()
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.from('Payment').delete().eq('id', id)

  const { data: invoice } = await db.from('Invoice').select('total').eq('id', payment.invoiceId).single()
  if (invoice) {
    const { data: remaining } = await db.from('Payment').select('amount').eq('invoiceId', payment.invoiceId)
    const amountPaid = (remaining ?? []).reduce((s, p) => s + p.amount, 0)
    const balance = invoice.total - amountPaid

    let status = 'Pending'
    if (balance <= 0) status = 'Paid'
    else if (amountPaid > 0) status = 'PartiallyPaid'

    await db.from('Invoice').update({ amountPaid, balance: Math.max(0, balance), status }).eq('id', payment.invoiceId)
  }

  return NextResponse.json({ ok: true })
}
