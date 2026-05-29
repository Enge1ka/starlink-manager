'use client'

import { useState, useEffect, Suspense } from 'react'
import Header from '@/components/header'
import { useToast } from '@/components/toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

type Customer = { id: string; code: string; name: string; company?: string }
type Item = { id: string; code: string; description: string; quantity: string; unit: string; unitPrice: string; discountPct: string; taxPct: string }

function newItem(): Item {
  return { id: Math.random().toString(36).slice(2), code: '', description: '', quantity: '1', unit: '', unitPrice: '0', discountPct: '0', taxPct: '0' }
}

function calcNett(item: Item) {
  const qty = parseFloat(item.quantity) || 0
  const price = parseFloat(item.unitPrice) || 0
  const disc = parseFloat(item.discountPct) || 0
  return (qty * price) * (1 - disc / 100)
}

function NewInvoiceInner() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preCustomer = searchParams.get('customer') ?? ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<{ defaultPaymentTerms: number; defaultTaxPct: number; showCodeColumn: boolean; showUnitColumn: boolean; showTaxColumn: boolean; showDiscountColumn: boolean } | null>(null)
  const [customerId, setCustomerId] = useState(preCustomer)
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [discountPct, setDiscountPct] = useState('0')
  const [items, setItems] = useState<Item[]>([newItem()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([c, s]) => {
      setCustomers(Array.isArray(c) ? c : [])
      setSettings(s)
      if (s?.defaultPaymentTerms) {
        const d = new Date()
        d.setDate(d.getDate() + s.defaultPaymentTerms)
        setDueDate(format(d, 'yyyy-MM-dd'))
      }
      if (s?.defaultTaxPct) {
        setItems([{ ...newItem(), taxPct: String(s.defaultTaxPct) }])
      }
    })
  }, [])

  function updateItem(id: string, key: keyof Item, value: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const subtotal = items.reduce((s, it) => s + calcNett(it), 0)
  const discAmt = subtotal * ((parseFloat(discountPct) || 0) / 100)
  const taxAmt = items.reduce((s, it) => {
    const net = calcNett(it)
    return s + net * ((parseFloat(it.taxPct) || 0) / 100)
  }, 0)
  const total = subtotal - discAmt + taxAmt

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast('Please select a customer', 'error'); return }
    if (items.length === 0) { toast('Add at least one item', 'error'); return }
    if (items.some(it => !it.description.trim())) { toast('All items need a description', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId, issueDate, dueDate, notes, discountPct: parseFloat(discountPct) || 0,
          items: items.map(it => ({
            code: it.code, description: it.description,
            quantity: parseFloat(it.quantity) || 1, unit: it.unit,
            unitPrice: parseFloat(it.unitPrice) || 0,
            discountPct: parseFloat(it.discountPct) || 0,
            taxPct: parseFloat(it.taxPct) || 0,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to create invoice', 'error'); return }
      toast('Invoice created')
      router.push(`/invoices/${data.id}`)
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  const showCode = settings?.showCodeColumn ?? true
  const showUnit = settings?.showUnitColumn ?? true
  const showTax = settings?.showTaxColumn ?? true
  const showDisc = settings?.showDiscountColumn ?? true

  const thStyle = { padding: '8px 10px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700 as const, color: '#555555', background: '#111111', textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm">Cancel</button>
        <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? <span className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#000' }} /> : null}
          {saving ? 'Creating...' : 'Create Invoice'}
        </button>
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="table-wrap">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #222222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Line Items</h3>
                <button type="button" onClick={() => setItems(prev => [...prev, newItem()])} className="btn btn-secondary btn-sm">+ Add Line</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '600px' }}>
                  <thead>
                    <tr>
                      {showCode && <th style={{ ...thStyle, width: '80px' }}>Code</th>}
                      <th style={thStyle}>Description *</th>
                      <th style={{ ...thStyle, width: '70px', textAlign: 'right' }}>Qty</th>
                      {showUnit && <th style={{ ...thStyle, width: '70px' }}>Unit</th>}
                      <th style={{ ...thStyle, width: '110px', textAlign: 'right' }}>Unit Price</th>
                      {showDisc && <th style={{ ...thStyle, width: '70px', textAlign: 'right' }}>Disc%</th>}
                      {showTax && <th style={{ ...thStyle, width: '70px', textAlign: 'right' }}>Tax%</th>}
                      <th style={{ ...thStyle, width: '110px', textAlign: 'right' }}>Net Price</th>
                      <th style={{ ...thStyle, width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                        {showCode && (
                          <td style={{ padding: '6px 8px' }}>
                            <input value={item.code} onChange={e => updateItem(item.id, 'code', e.target.value)} placeholder="SUB" style={{ padding: '5px 8px', fontSize: '12px' }} />
                          </td>
                        )}
                        <td style={{ padding: '6px 8px' }}>
                          <textarea value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Description..." rows={2} style={{ padding: '5px 8px', fontSize: '12px', resize: 'vertical' }} required />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', textAlign: 'right' }} />
                        </td>
                        {showUnit && (
                          <td style={{ padding: '6px 8px' }}>
                            <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="ea" style={{ padding: '5px 8px', fontSize: '12px' }} />
                          </td>
                        )}
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', textAlign: 'right' }} />
                        </td>
                        {showDisc && (
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" min="0" max="100" step="0.01" value={item.discountPct} onChange={e => updateItem(item.id, 'discountPct', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', textAlign: 'right' }} />
                          </td>
                        )}
                        {showTax && (
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" min="0" max="100" step="0.01" value={item.taxPct} onChange={e => updateItem(item.id, 'taxPct', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', textAlign: 'right' }} />
                          </td>
                        )}
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', color: '#ffffff' }}>
                          K {calcNett(item).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => removeItem(item.id)} className="btn-icon" style={{ color: '#ff4444' }} disabled={items.length === 1}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="label">Invoice Notes / Description</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes that appear on the invoice..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Invoice Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="label">Customer *</label>
                  <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                    <option value="">— Select Customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Issue Date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Invoice Discount %</label>
                  <input type="number" min="0" max="100" step="0.01" value={discountPct} onChange={e => setDiscountPct(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Subtotal', value: subtotal },
                  { label: `Discount (${discountPct}%)`, value: -discAmt },
                  { label: 'Tax', value: taxAmt },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #222222' }}>
                    <span style={{ color: '#888888' }}>{label}</span>
                    <span style={{ color: '#cccccc' }}>K {Math.abs(value).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, padding: '10px 0', borderTop: '1px solid #2a2a2a', marginTop: '4px' }}>
                  <span style={{ color: '#ffffff' }}>Total</span>
                  <span style={{ color: '#ffffff' }}>K {total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>}>
      <NewInvoiceInner />
    </Suspense>
  )
}
