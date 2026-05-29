import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await db
    .from('Settings')
    .upsert({ id: 'singleton' }, { onConflict: 'id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const allowed = [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyLogo',
    'bankAccountName', 'bankName', 'bankAccountNumber', 'bankBranchName',
    'bankBranchCode', 'bankSortCode', 'bankSwift',
    'invoicePrefix', 'invoiceNextNumber', 'defaultPaymentTerms', 'defaultTaxPct',
    'currency', 'currencySymbol',
    'showLogo', 'showBankDetails', 'showTaxColumn', 'showDiscountColumn',
    'showUnitColumn', 'showCodeColumn', 'showShipTo', 'showTaxReference', 'showYourReference',
    'footerText', 'expiryWarningDays1', 'expiryWarningDays2',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await db
    .from('Settings')
    .upsert({ id: 'singleton', ...updates }, { onConflict: 'id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
