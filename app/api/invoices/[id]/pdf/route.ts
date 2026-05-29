import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoice-pdf'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [{ data: invoice }, { data: settings }] = await Promise.all([
    db.from('Invoice').select('*, Customer(*), InvoiceItem(*), Payment(*)').eq('id', id).single(),
    db.from('Settings').select('*').eq('id', 'singleton').single(),
  ])

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any
  const shaped = {
    ...inv,
    customer: inv.Customer,
    items: inv.InvoiceItem,
    payments: inv.Payment,
  }

  const buffer = await renderToBuffer(InvoicePDF({ invoice: shaped, settings }))
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  })
}
