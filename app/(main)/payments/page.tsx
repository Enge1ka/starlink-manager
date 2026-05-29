'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Payment = {
  id: string; amount: number; paymentDate: string; method?: string
  reference?: string; notes?: string; createdAt: string
  invoice: { id: string; invoiceNumber: string; customer: { id: string; code: string; name: string } }
}

const METHODS = ['Bank Transfer', 'Cash', 'Mobile Money', 'Cheque', 'Other']

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMethod, setFilterMethod] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/payments')
    const data = await res.json()
    setPayments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filterMethod ? payments.filter(p => p.method === filterMethod) : payments
  const total = filtered.reduce((s, p) => s + p.amount, 0)

  async function handleDelete(p: Payment) {
    if (!confirm(`Remove this payment of K${p.amount.toLocaleString()}? The invoice balance will be recalculated.`)) return
    try {
      const res = await fetch(`/api/payments/${p.id}`, { method: 'DELETE' })
      if (res.ok) { toast('Payment removed'); load() }
      else toast('Delete failed', 'error')
    } catch { toast('Network error', 'error') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total Payments Recorded</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>{payments.length}</div>
          </div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Amount Shown</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#aaaaaa' }}>K {total.toLocaleString()}</div>
          </div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Filtering By</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{filterMethod || 'All Methods'}</div>
          </div>
        </div>

        <div className="filter-row">
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ width: '200px' }}>
            <option value="">All Methods</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No payments found. Record payments from the invoice detail page.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Date', 'Customer', 'Invoice', 'Amount', 'Method', 'Reference', 'Notes', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>
                      <Link href={`/customers/${p.invoice.customer.id}`} style={{ color: '#ffffff' }}>{p.invoice.customer.name}</Link>
                    </td>
                    <td>
                      <Link href={`/invoices/${p.invoice.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{p.invoice.invoiceNumber}</Link>
                    </td>
                    <td style={{ color: '#ffffff', fontWeight: 700 }}>K {p.amount.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</td>
                    <td><span className="badge status-partial">{p.method || '—'}</span></td>
                    <td>{p.reference || '—'}</td>
                    <td>{p.notes || '—'}</td>
                    <td>
                      <button onClick={() => handleDelete(p)} className="btn-icon" style={{ color: '#ff4444' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
