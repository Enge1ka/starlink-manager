'use client'

import { useState, useEffect, use } from 'react'
import Header from '@/components/header'
import Modal from '@/components/modal'
import { useToast } from '@/components/toast'
import { formatDate, formatDateLong } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

type InvoiceItem = { id: string; code?: string; description: string; quantity: number; unit?: string; unitPrice: number; discountPct: number; taxPct: number; nettPrice: number }
type Payment = { id: string; amount: number; paymentDate: string; method?: string; reference?: string; notes?: string }
type Customer = { id: string; code: string; name: string; company?: string; address?: string; phone?: string; email?: string }
type Invoice = {
  id: string; invoiceNumber: string; issueDate: string; dueDate: string; status: string; notes?: string
  subtotal: number; discountPct: number; discountAmt: number; taxAmt: number; total: number; amountPaid: number; balance: number
  customer: Customer; items: InvoiceItem[]; payments: Payment[]; createdAt: string
}

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  Pending: { cls: 'status-pending', label: 'Pending' },
  Paid: { cls: 'status-paid', label: 'Paid' },
  PartiallyPaid: { cls: 'status-partial', label: 'Partially Paid' },
  Overdue: { cls: 'status-overdue', label: 'Overdue' },
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), method: 'Bank Transfer', reference: '', notes: '' })
  const [payLoading, setPayLoading] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(d => { setInvoice(d); setLoading(false) })
  }, [id])

  async function downloadPdf() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`)
      if (!res.ok) { toast('PDF generation failed', 'error'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${invoice?.invoiceNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast('Download failed', 'error') }
    finally { setDownloading(false) }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault(); setPayLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, ...payForm, amount: parseFloat(payForm.amount) }),
      })
      if (res.ok) {
        toast('Payment recorded')
        setShowPayment(false)
        setPayForm({ amount: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), method: 'Bank Transfer', reference: '', notes: '' })
        const updated = await fetch(`/api/invoices/${id}`).then(r => r.json())
        setInvoice(updated)
      } else {
        const d = await res.json(); toast(d.error ?? 'Failed', 'error')
      }
    } catch { toast('Network error', 'error') }
    finally { setPayLoading(false) }
  }

  async function updateStatus() {
    const res = await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    if (res.ok) {
      const d = await res.json(); setInvoice(prev => prev ? { ...prev, ...d } : d)
      toast('Status updated'); setShowStatusModal(false)
    } else toast('Update failed', 'error')
  }

  async function deletePayment(payId: string) {
    const res = await fetch(`/api/payments/${payId}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Payment removed')
      const updated = await fetch(`/api/invoices/${id}`).then(r => r.json())
      setInvoice(updated)
    } else toast('Delete failed', 'error')
  }

  if (loading) return <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
  if (!invoice) return <div style={{ padding: '40px', textAlign: 'center', color: '#888888' }}>Not found. <Link href="/invoices" style={{ color: '#6ec6ff' }}>Go back</Link></div>

  const sc = STATUS_CFG[invoice.status] || STATUS_CFG.Pending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <Link href="/invoices" style={{ color: '#888888', fontSize: '13px' }}>← Invoices</Link>
        <button onClick={() => { setNewStatus(invoice.status); setShowStatusModal(true) }} className="btn btn-secondary btn-sm">Change Status</button>
        {invoice.balance > 0 && (
          <button onClick={() => { setPayForm({ ...payForm, amount: String(invoice.balance) }); setShowPayment(true) }} className="btn btn-secondary btn-sm">
            Record Payment
          </button>
        )}
        <button onClick={downloadPdf} className="btn btn-primary btn-sm" disabled={downloading}>
          {downloading ? <span className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#000' }} /> : '⬇'}
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#ffffff' }}>Tax Invoice</div>
                  <div style={{ fontSize: '13px', color: '#888888' }}>#{invoice.invoiceNumber}</div>
                </div>
                <span className={`badge ${sc.cls}`} style={{ fontSize: '12px', padding: '4px 10px' }}>{sc.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Bill To</div>
                  <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>{invoice.customer.name}</div>
                  {invoice.customer.company && <div style={{ fontSize: '12px', color: '#888888' }}>{invoice.customer.company}</div>}
                  {invoice.customer.phone && <div style={{ fontSize: '12px', color: '#888888' }}>{invoice.customer.phone}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Issue Date</div>
                  <div style={{ fontWeight: 500, color: '#cccccc', marginBottom: '10px' }}>{formatDateLong(invoice.issueDate)}</div>
                  <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontWeight: 500, color: '#cccccc' }}>{formatDateLong(invoice.dueDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Customer Code</div>
                  <Link href={`/customers/${invoice.customer.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{invoice.customer.code}</Link>
                </div>
              </div>
              {invoice.notes && (
                <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#888888' }}>
                  {invoice.notes}
                </div>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Code', 'Description', 'Qty', 'Unit', 'Unit Price', 'Disc%', 'Tax%', 'Net Price'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontSize: '12px' }}>{item.code || '—'}</td>
                      <td style={{ maxWidth: '280px', color: '#ffffff' }}>{item.description}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity.toFixed(2)}</td>
                      <td>{item.unit || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#ffffff' }}>K {item.unitPrice.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{item.discountPct}%</td>
                      <td style={{ textAlign: 'right' }}>{item.taxPct}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>K {item.nettPrice.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 16px 0' }}>
                <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Sub Total', value: `K ${invoice.subtotal.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}` },
                    { label: `Discount @ ${invoice.discountPct}%`, value: `${invoice.discountAmt > 0 ? '- ' : ''}K ${invoice.discountAmt.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}` },
                    { label: 'Amount Excl Tax', value: `K ${(invoice.subtotal - invoice.discountAmt).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}` },
                    { label: 'Tax', value: `K ${invoice.taxAmt.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #222222' }}>
                      <span style={{ color: '#888888' }}>{label}</span>
                      <span style={{ color: '#cccccc' }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, padding: '10px 12px', background: '#111111', borderRadius: '6px', marginTop: '4px', border: '1px solid #222222' }}>
                    <span style={{ color: '#ffffff' }}>Total</span>
                    <span style={{ color: '#ffffff' }}>K {invoice.total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {invoice.amountPaid > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', color: '#aaaaaa' }}>
                        <span>Amount Paid</span>
                        <span>K {invoice.amountPaid.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, padding: '10px 12px', background: invoice.balance > 0 ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: '6px', border: `1px solid ${invoice.balance > 0 ? 'rgba(255,68,68,0.2)' : '#2a2a2a'}`, color: invoice.balance > 0 ? '#ff4444' : '#aaaaaa' }}>
                        <span>Balance Due</span>
                        <span>K {invoice.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {invoice.payments.length > 0 && (
              <div className="table-wrap">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #222222' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Payments Received</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      {['Date', 'Amount', 'Method', 'Reference', 'Notes', ''].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>K {p.amount.toLocaleString()}</td>
                        <td>{p.method || '—'}</td>
                        <td>{p.reference || '—'}</td>
                        <td>{p.notes || '—'}</td>
                        <td>
                          <button onClick={() => deletePayment(p.id)} className="btn-icon" style={{ color: '#ff4444' }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Balance Due</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: invoice.balance > 0 ? '#ff4444' : '#aaaaaa', letterSpacing: '-0.02em' }}>
                K {invoice.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: '#555555', marginTop: '4px' }}>
                {invoice.balance === 0 ? 'Fully paid' : invoice.balance === invoice.total ? 'Not yet paid' : `K ${invoice.amountPaid.toLocaleString()} received`}
              </div>
              {invoice.balance > 0 && (
                <button
                  onClick={() => { setPayForm({ ...payForm, amount: String(invoice.balance) }); setShowPayment(true) }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}
                >
                  Record Payment
                </button>
              )}
            </div>
            <div className="card">
              <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={downloadPdf} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled={downloading}>
                  {downloading ? 'Generating PDF...' : '⬇ Download PDF'}
                </button>
                <button onClick={() => { setNewStatus(invoice.status); setShowStatusModal(true) }} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Change Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={recordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="label">Amount (ZMW) *</label>
            <input type="number" min="0.01" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Payment Date</label>
            <input type="date" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
              {['Bank Transfer', 'Cash', 'Mobile Money', 'Cheque', 'Other'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Reference</label>
            <input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Bank ref, transaction ID..." />
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={() => setShowPayment(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={payLoading}>
              {payLoading ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000' }} /> : null}
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Invoice Status" width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <button key={key} onClick={() => setNewStatus(key)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: newStatus === key ? 'rgba(255,255,255,0.06)' : '#111111',
                border: `1px solid ${newStatus === key ? '#3a3a3a' : '#222222'}`,
                borderRadius: '6px', cursor: 'pointer', color: '#ffffff', textAlign: 'left',
                transition: 'background 0.15s',
              }}>
                <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowStatusModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={updateStatus} className="btn btn-primary">Apply</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
