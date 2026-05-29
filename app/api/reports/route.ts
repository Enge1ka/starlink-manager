import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'overview'

  if (type === 'outstanding') {
    const { data, error } = await db
      .from('Invoice')
      .select('*, Customer(id, code, name)')
      .in('status', ['Pending', 'PartiallyPaid', 'Overdue'])
      .order('status')
      .order('dueDate')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json((data ?? []).map(({ Customer: customer, ...inv }: any) => ({ ...inv, customer })))
  }

  if (type === 'customer-balances') {
    const { data: customers } = await db
      .from('Customer')
      .select('id, code, name, Invoice(total, amountPaid, balance, status)')
      .eq('isActive', true)
      .order('name')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (customers ?? []).map(({ Invoice: invoices, ...c }: any) => {
      const invs = (invoices as Array<{ total: number; amountPaid: number; balance: number; status: string }>) ?? []
      return {
        ...c,
        totalInvoiced: invs.reduce((s, i) => s + i.total, 0),
        totalPaid: invs.reduce((s, i) => s + i.amountPaid, 0),
        totalBalance: invs.reduce((s, i) => s + i.balance, 0),
        invoiceCount: invs.length,
        overdueCount: invs.filter(i => i.status === 'Overdue').length,
      }
    })
    return NextResponse.json(result)
  }

  if (type === 'kit-status') {
    const { data: kits } = await db.from('Kit').select('status, billingType, monthlyCost')

    const byStatusMap: Record<string, { status: string; _count: { id: number }; _sum: { monthlyCost: number } }> = {}
    const byBillingMap: Record<string, { billingType: string; _count: { id: number }; _sum: { monthlyCost: number } }> = {}

    for (const kit of kits ?? []) {
      const s = kit.status
      if (!byStatusMap[s]) byStatusMap[s] = { status: s, _count: { id: 0 }, _sum: { monthlyCost: 0 } }
      byStatusMap[s]._count.id++
      byStatusMap[s]._sum.monthlyCost += kit.monthlyCost ?? 0

      const b = kit.billingType
      if (!byBillingMap[b]) byBillingMap[b] = { billingType: b, _count: { id: 0 }, _sum: { monthlyCost: 0 } }
      byBillingMap[b]._count.id++
      byBillingMap[b]._sum.monthlyCost += kit.monthlyCost ?? 0
    }

    return NextResponse.json({ byStatus: Object.values(byStatusMap), byBilling: Object.values(byBillingMap) })
  }

  if (type === 'monthly-revenue') {
    const { data: payments } = await db.from('Payment').select('amount, paymentDate').order('paymentDate')
    const grouped: Record<string, number> = {}
    for (const p of payments ?? []) {
      const key = p.paymentDate.slice(0, 7)
      grouped[key] = (grouped[key] ?? 0) + p.amount
    }
    return NextResponse.json(Object.entries(grouped).sort().map(([month, amount]) => ({ month, amount })))
  }

  // overview
  const [
    { count: kits },
    { count: customers },
    { count: payments },
    { data: invoices },
    { data: outstanding },
  ] = await Promise.all([
    db.from('Kit').select('*', { count: 'exact', head: true }),
    db.from('Customer').select('*', { count: 'exact', head: true }),
    db.from('Payment').select('*', { count: 'exact', head: true }),
    db.from('Invoice').select('total, amountPaid'),
    db.from('Invoice').select('balance').gt('balance', 0),
  ])

  return NextResponse.json({
    totalRevenue: (invoices ?? []).reduce((s, i) => s + (i.total ?? 0), 0),
    totalCollected: (invoices ?? []).reduce((s, i) => s + (i.amountPaid ?? 0), 0),
    totalOutstanding: (outstanding ?? []).reduce((s, i) => s + (i.balance ?? 0), 0),
    kits: kits ?? 0,
    customers: customers ?? 0,
    payments: payments ?? 0,
  })
}
