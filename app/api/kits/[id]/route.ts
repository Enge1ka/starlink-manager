import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data, error } = await db.from('Kit').select('*, Customer(id, code, name)').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Customer: customer, ...kit } = data as any
  return NextResponse.json({ ...kit, customer })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const { kitName, dishId, routerId, terminalId, status, customerId, location, installedDate, billingType, monthlyCost, expiryDate, notes } = body

  const { data, error } = await db
    .from('Kit')
    .update({
      kitName, dishId, routerId, terminalId, status,
      customerId: customerId || null,
      location,
      installedDate: installedDate || null,
      billingType,
      monthlyCost: Number(monthlyCost),
      expiryDate: expiryDate || null,
      notes,
    })
    .eq('id', id)
    .select('*, Customer(id, code, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Customer: customer, ...kit } = data as any
  return NextResponse.json({ ...kit, customer })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { error } = await db.from('Kit').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
