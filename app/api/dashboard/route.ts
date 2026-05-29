import { NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await db.from('Settings').select('expiryWarningDays1, expiryWarningDays2, currencySymbol').eq('id', 'singleton').single()
  const warn1 = settings?.expiryWarningDays1 ?? 7
  const warn2 = settings?.expiryWarningDays2 ?? 3

  const now = new Date()
  const soon1 = new Date(now); soon1.setDate(now.getDate() + warn1)
  const soon2 = new Date(now); soon2.setDate(now.getDate() + warn2)

  const [
    { count: totalKits },
    { count: activeKits },
    { count: totalCustomers },
    { count: totalInvoices },
    { count: overdueInvoices },
    { count: pendingInvoices },
    { count: paidInvoices },
    { data: expiredKits },
    { data: criticalKits },
    { data: warningKits },
    { data: recentInvoicesRaw },
    { data: recentPaymentsRaw },
    { data: allInvoices },
    { data: outstandingInvoices },
  ] = await Promise.all([
    db.from('Kit').select('*', { count: 'exact', head: true }),
    db.from('Kit').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    db.from('Customer').select('*', { count: 'exact', head: true }).eq('isActive', true),
    db.from('Invoice').select('*', { count: 'exact', head: true }),
    db.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'Overdue'),
    db.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    db.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'Paid'),
    db.from('Kit').select('*, Customer(id, name)').lt('expiryDate', now.toISOString()).eq('status', 'Active').order('expiryDate').limit(10),
    db.from('Kit').select('*, Customer(id, name)').gte('expiryDate', now.toISOString()).lte('expiryDate', soon2.toISOString()).eq('status', 'Active').order('expiryDate').limit(10),
    db.from('Kit').select('*, Customer(id, name)').gte('expiryDate', soon2.toISOString()).lte('expiryDate', soon1.toISOString()).eq('status', 'Active').order('expiryDate').limit(10),
    db.from('Invoice').select('*, Customer(id, name)').order('createdAt', { ascending: false }).limit(5),
    db.from('Payment').select('*, Invoice(invoiceNumber, Customer(name))').order('paymentDate', { ascending: false }).limit(5),
    db.from('Invoice').select('total, amountPaid'),
    db.from('Invoice').select('balance').in('status', ['Pending', 'PartiallyPaid', 'Overdue']),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeKit = ({ Customer: customer, ...k }: any) => ({ ...k, customer })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeInvoice = ({ Customer: customer, ...inv }: any) => ({ ...inv, customer })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapePayment = ({ Invoice: inv, ...p }: any) => ({ ...p, invoice: { ...inv, customer: inv?.Customer } })

  const totalRevenue = (allInvoices ?? []).reduce((s: number, i) => s + (i.total ?? 0), 0)
  const totalCollected = (allInvoices ?? []).reduce((s: number, i) => s + (i.amountPaid ?? 0), 0)
  const totalOutstanding = (outstandingInvoices ?? []).reduce((s: number, i) => s + (i.balance ?? 0), 0)

  return NextResponse.json({
    kits: { total: totalKits ?? 0, active: activeKits ?? 0 },
    customers: { total: totalCustomers ?? 0 },
    invoices: { total: totalInvoices ?? 0, overdue: overdueInvoices ?? 0, pending: pendingInvoices ?? 0, paid: paidInvoices ?? 0 },
    expiring: {
      expired: (expiredKits ?? []).map(shapeKit),
      critical: (criticalKits ?? []).map(shapeKit),
      warning: (warningKits ?? []).map(shapeKit),
    },
    recentInvoices: (recentInvoicesRaw ?? []).map(shapeInvoice),
    recentPayments: (recentPaymentsRaw ?? []).map(shapePayment),
    revenue: { total: totalRevenue, collected: totalCollected, outstanding: totalOutstanding },
    settings: { warn1, warn2, currencySymbol: settings?.currencySymbol ?? 'K' },
  })
}
