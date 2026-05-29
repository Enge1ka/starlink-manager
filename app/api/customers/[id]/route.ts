import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [{ data: customer }, { data: kits }, { data: invoicesRaw }] = await Promise.all([
    db.from('Customer').select('*').eq('id', id).single(),
    db.from('Kit').select('*').eq('customerId', id).order('createdAt', { ascending: false }),
    db.from('Invoice').select('*, Payment(count)').eq('customerId', id).order('createdAt', { ascending: false }),
  ])

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoices = (invoicesRaw ?? []).map(({ Payment: p, ...inv }: any) => ({
    ...inv,
    _count: { payments: (p as Array<{ count: number }>)?.[0]?.count ?? 0 },
  }))

  return NextResponse.json({ ...customer, kits, invoices })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const { name, company, phone, email, address, tpin, notes, isActive } = body

  const { data, error } = await db
    .from('Customer')
    .update({ name, company, phone, email, address, tpin, notes, isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [{ count: kits }, { count: invoices }] = await Promise.all([
    db.from('Kit').select('*', { count: 'exact', head: true }).eq('customerId', id),
    db.from('Invoice').select('*', { count: 'exact', head: true }).eq('customerId', id),
  ])

  if ((kits ?? 0) > 0 || (invoices ?? 0) > 0)
    return NextResponse.json({ error: 'Cannot delete customer with linked kits or invoices' }, { status: 400 })

  const { error } = await db.from('Customer').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
