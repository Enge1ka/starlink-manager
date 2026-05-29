'use client'

import { useState, useEffect, use } from 'react'
import Header from '@/components/header'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Kit = { id: string; kitName: string; serialNumber: string; status: string; expiryDate?: string; monthlyCost: number; billingType: string }
type Invoice = { id: string; invoiceNumber: string; issueDate: string; dueDate: string; total: number; status: string; balance: number }
type Customer = {
  id: string; code: string; name: string; company?: string; phone?: string; email?: string
  address?: string; tpin?: string; notes?: string; isActive: boolean; createdAt: string
  kits: Kit[]; invoices: Invoice[]
}

const KIT_STATUS_CLS: Record<string, string> = {
  Active: 'status-active', Offline: 'status-offline', Suspended: 'status-suspended', InStorage: 'status-instorage',
}
const INV_STATUS_CFG: Record<string, { cls: string; label: string }> = {
  Pending: { cls: 'status-pending', label: 'Pending' },
  Paid: { cls: 'status-paid', label: 'Paid' },
  PartiallyPaid: { cls: 'status-partial', label: 'Partial' },
  Overdue: { cls: 'status-overdue', label: 'Overdue' },
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', tpin: '', notes: '', isActive: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(d => {
      setCustomer(d)
      setForm({ name: d.name, company: d.company ?? '', phone: d.phone ?? '', email: d.email ?? '', address: d.address ?? '', tpin: d.tpin ?? '', notes: d.notes ?? '', isActive: d.isActive })
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        const d = await res.json()
        setCustomer(prev => prev ? { ...prev, ...d } : d)
        toast('Customer updated'); setEditing(false)
      } else toast('Failed to save', 'error')
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
  if (!customer) return <div style={{ padding: '40px', textAlign: 'center', color: '#888888' }}>Customer not found. <Link href="/customers" style={{ color: '#6ec6ff' }}>Go back</Link></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <Link href="/customers" style={{ color: '#888888', fontSize: '13px' }}>← Customers</Link>
        {!editing && <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">Edit</button>}
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#888888' }}>Code: <strong style={{ color: '#6ec6ff' }}>{customer.code}</strong></span>
                <span className={`badge ${customer.isActive ? 'status-active' : 'status-instorage'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {editing ? (
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Name', key: 'name', req: true },
                    { label: 'Company', key: 'company' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Email', key: 'email' },
                    { label: 'TPIN / NRC', key: 'tpin' },
                  ].map(({ label, key, req }) => (
                    <div key={key} className="form-group">
                      <label className="label">{label}</label>
                      <input value={form[key as keyof typeof form] as string} onChange={e => setForm({ ...form, [key]: e.target.value })} required={req} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="label">Address</label>
                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label className="label">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label className="label">Status</label>
                    <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{customer.name}</h2>
                  {customer.company && <p style={{ color: '#888888', fontSize: '14px' }}>{customer.company}</p>}
                  {[
                    { label: 'Phone', value: customer.phone },
                    { label: 'Email', value: customer.email },
                    { label: 'TPIN/NRC', value: customer.tpin },
                    { label: 'Address', value: customer.address },
                    { label: 'Customer since', value: formatDate(customer.createdAt) },
                  ].map(({ label, value }) => value ? (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#cccccc' }}>{value}</span>
                    </div>
                  ) : null)}
                  {customer.notes && (
                    <div style={{ background: '#111111', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#888888', border: '1px solid #222222' }}>
                      {customer.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href={`/invoices/new?customer=${customer.id}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>+ Create Invoice</Link>
                <Link href={`/kits?customer=${customer.id}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>View Kits</Link>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="table-wrap">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #222222' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Assigned Kits ({customer.kits.length})</h3>
              </div>
              {customer.kits.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>No kits assigned</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      {['Kit Name', 'Serial No.', 'Status', 'Billing', 'Monthly Cost', 'Expiry'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {customer.kits.map(k => (
                      <tr key={k.id}>
                        <td><Link href={`/kits/${k.id}`} style={{ color: '#6ec6ff', fontWeight: 500 }}>{k.kitName}</Link></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{k.serialNumber}</td>
                        <td><span className={`badge ${KIT_STATUS_CLS[k.status] || 'status-instorage'}`}>{k.status}</span></td>
                        <td>{k.billingType === 'CompanyBilling' ? 'Company' : 'Client'}</td>
                        <td style={{ color: '#ffffff' }}>K {k.monthlyCost.toLocaleString()}</td>
                        <td>{formatDate(k.expiryDate) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-wrap">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #222222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Invoices ({customer.invoices.length})</h3>
                <Link href={`/invoices/new?customer=${customer.id}`} className="btn btn-primary btn-sm">+ Invoice</Link>
              </div>
              {customer.invoices.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>No invoices yet</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      {['Invoice #', 'Issue Date', 'Due Date', 'Total', 'Status', 'Balance'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map(inv => {
                      const sc = INV_STATUS_CFG[inv.status] || INV_STATUS_CFG.Pending
                      return (
                        <tr key={inv.id}>
                          <td><Link href={`/invoices/${inv.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                          <td>{formatDate(inv.issueDate)}</td>
                          <td>{formatDate(inv.dueDate)}</td>
                          <td style={{ color: '#ffffff' }}>K {inv.total.toLocaleString()}</td>
                          <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                          <td style={{ color: inv.balance > 0 ? '#ff4444' : '#888888', fontWeight: inv.balance > 0 ? 600 : 400 }}>
                            K {inv.balance.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
