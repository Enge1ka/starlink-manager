import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  let query = db.from('Customer').select('*, Kit(count), Invoice(count)').order('createdAt', { ascending: false })
  if (q) {
    query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (data ?? []).map(({ Kit: k, Invoice: i, ...c }: any) => ({
    ...c,
    _count: {
      kits: (k as Array<{ count: number }>)?.[0]?.count ?? 0,
      invoices: (i as Array<{ count: number }>)?.[0]?.count ?? 0,
    },
  }))

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { code, name, company, phone, email, address, tpin, notes } = body

  if (!code || !name) return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })

  const { data: existing } = await db.from('Customer').select('id').eq('code', code).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Customer code already exists' }, { status: 400 })

  const { data, error } = await db
    .from('Customer')
    .insert({ id: crypto.randomUUID(), code, name, company, phone, email, address, tpin, notes })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
