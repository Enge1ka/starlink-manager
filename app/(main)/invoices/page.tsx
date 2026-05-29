'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import Confirm from '@/components/confirm'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Customer = { id: string; code: string; name: string }
type Invoice = {
  id: string; invoiceNumber: string; issueDate: string; dueDate: string
  status: string; total: number; amountPaid: number; balance: number
  customer: Customer; createdAt: string
}

const STATUSES = ['Pending', 'Paid', 'PartiallyPaid', 'Overdue']
const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  Pending: { cls: 'status-pending', label: 'Pending' },
  Paid: { cls: 'status-paid', label: 'Paid' },
  PartiallyPaid: { cls: 'status-partial', label: 'Partial' },
  Overdue: { cls: 'status-overdue', label: 'Overdue' },
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleting, setDeleting] = useState<Invoice | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filterStatus) params.set('status', filterStatus)
    const res = await fetch(`/api/invoices?${params}`)
    const data = await res.json()
    setInvoices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/invoices/${deleting.id}`, { method: 'DELETE' })
      if (res.ok) { toast('Invoice deleted'); load() }
      else toast('Delete failed', 'error')
    } catch { toast('Network error', 'error') }
    finally { setDeleteLoading(false); setDeleting(null) }
  }

  async function downloadPdf(inv: Invoice) {
    setDownloading(inv.id)
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pdf`)
      if (!res.ok) { toast('Failed to generate PDF', 'error'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast('PDF download failed', 'error') }
    finally { setDownloading(null) }
  }

  const totals = invoices.reduce((acc, inv) => ({
    total: acc.total + inv.total,
    paid: acc.paid + inv.amountPaid,
    outstanding: acc.outstanding + inv.balance,
  }), { total: 0, paid: 0, outstanding: 0 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <Link href="/invoices/new" className="btn btn-primary btn-sm">+ New Invoice</Link>
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Invoiced', value: `K ${totals.total.toLocaleString()}`, color: '#ffffff' },
            { label: 'Total Paid', value: `K ${totals.paid.toLocaleString()}`, color: '#aaaaaa' },
            { label: 'Outstanding', value: `K ${totals.outstanding.toLocaleString()}`, color: totals.outstanding > 0 ? '#ff4444' : '#888888' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="filter-row">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." style={{ width: '280px' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            {search || filterStatus ? 'No invoices match your filter.' : 'No invoices yet. Click "+ New Invoice" to create one.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Invoice #', 'Customer', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const sc = STATUS_CFG[inv.status] || STATUS_CFG.Pending
                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link href={`/invoices/${inv.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{inv.invoiceNumber}</Link>
                      </td>
                      <td>
                        <Link href={`/customers/${inv.customer.id}`} style={{ color: '#ffffff' }}>{inv.customer.name}</Link>
                      </td>
                      <td>{formatDate(inv.issueDate)}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td style={{ color: '#ffffff', fontWeight: 500 }}>K {inv.total.toLocaleString()}</td>
                      <td style={{ color: '#aaaaaa' }}>K {inv.amountPaid.toLocaleString()}</td>
                      <td style={{ fontWeight: inv.balance > 0 ? 600 : 400, color: inv.balance > 0 ? '#ff4444' : '#555555' }}>
                        K {inv.balance.toLocaleString()}
                      </td>
                      <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => downloadPdf(inv)} className="btn-icon" title="Download PDF" disabled={downloading === inv.id}>
                            {downloading === inv.id ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : '⬇'}
                          </button>
                          <Link href={`/invoices/${inv.id}`} className="btn-icon" title="View">👁</Link>
                          <button onClick={() => setDeleting(inv)} className="btn-icon" style={{ color: '#ff4444' }} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Confirm open={!!deleting} title="Delete Invoice" message={`Delete invoice ${deleting?.invoiceNumber}? All payments will also be deleted.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
    </div>
  )
}
