import { format, parseISO, differenceInDays, isValid } from 'date-fns'

export function formatCurrency(amount: number, symbol = 'K'): string {
  return `${symbol} ${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy')
}

export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd MMM yyyy')
}

export function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null
  const d = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
  if (!isValid(d)) return null
  return differenceInDays(d, new Date())
}

export function getExpiryStatus(days: number | null): 'expired' | 'critical' | 'warning' | 'ok' {
  if (days === null) return 'ok'
  if (days < 0) return 'expired'
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  return 'ok'
}

export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case 'Paid': return 'text-green-400 bg-green-400/10'
    case 'PartiallyPaid': return 'text-blue-400 bg-blue-400/10'
    case 'Overdue': return 'text-red-400 bg-red-400/10'
    case 'Pending': return 'text-yellow-400 bg-yellow-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export function getKitStatusColor(status: string): string {
  switch (status) {
    case 'Active': return 'text-green-400 bg-green-400/10'
    case 'Offline': return 'text-red-400 bg-red-400/10'
    case 'Suspended': return 'text-yellow-400 bg-yellow-400/10'
    case 'InStorage': return 'text-slate-400 bg-slate-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export function generateInvoiceNumber(prefix: string, nextNumber: number): string {
  return `${prefix}${String(nextNumber).padStart(5, '0')}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function calcInvoiceTotals(
  items: { quantity: number; unitPrice: number; discountPct: number; taxPct: number }[],
  discountPct: number
) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineDiscount = lineTotal * (item.discountPct / 100)
    const lineNet = lineTotal - lineDiscount
    return sum + lineNet
  }, 0)
  const discountAmt = subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineDiscount = lineTotal * (item.discountPct / 100)
    const lineNet = lineTotal - lineDiscount
    return sum + lineNet * (item.taxPct / 100)
  }, 0)
  const total = afterDiscount + taxAmt
  return { subtotal, discountAmt, taxAmt, total }
}
