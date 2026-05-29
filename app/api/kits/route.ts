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
  const expiring = searchParams.get('expiring')

  let query = db.from('Kit').select('*, Customer(id, code, name)').order('expiryDate').order('createdAt', { ascending: false })

  if (status) query = query.eq('status', status)
  if (customerId) query = query.eq('customerId', customerId)
  if (expiring === 'true') {
    const soon = new Date()
    soon.setDate(soon.getDate() + 7)
    query = query.lte('expiryDate', soon.toISOString()).eq('status', 'Active')
  }
  if (q) {
    query = query.or(`kitName.ilike.%${q}%,serialNumber.ilike.%${q}%,location.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kits = (data ?? []).map(({ Customer: customer, ...k }: any) => ({ ...k, customer }))
  return NextResponse.json(kits)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { kitName, serialNumber, dishId, routerId, terminalId, status, customerId, location, installedDate, billingType, monthlyCost, expiryDate, notes } = body

  if (!kitName || !serialNumber)
    return NextResponse.json({ error: 'Kit name and serial number are required' }, { status: 400 })

  const { data: existing } = await db.from('Kit').select('id').eq('serialNumber', serialNumber).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Serial number already exists' }, { status: 400 })

  const { data, error } = await db
    .from('Kit')
    .insert({
      id: crypto.randomUUID(),
      kitName, serialNumber, dishId, routerId, terminalId,
      status: status || 'Active',
      customerId: customerId || null,
      location,
      installedDate: installedDate || null,
      billingType: billingType || 'ClientBilling',
      monthlyCost: monthlyCost ? Number(monthlyCost) : 0,
      expiryDate: expiryDate || null,
      notes,
    })
    .select('*, Customer(id, code, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Customer: customer, ...kit } = data as any
  return NextResponse.json({ ...kit, customer }, { status: 201 })
}
