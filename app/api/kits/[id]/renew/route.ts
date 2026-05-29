import { NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: kit, error: fetchErr } = await db.from('Kit').select('expiryDate').eq('id', id).single()
  if (fetchErr || !kit) return NextResponse.json({ error: 'Kit not found' }, { status: 404 })

  const base = kit.expiryDate ? new Date(kit.expiryDate) : new Date()
  base.setDate(base.getDate() + 30)

  const { data, error } = await db.from('Kit').update({ expiryDate: base.toISOString() }).eq('id', id).select('*, Customer(id, code, name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { Customer: customer, ...rest } = data as Record<string, unknown> & { Customer: unknown }
  return NextResponse.json({ ...rest, customer })
}
