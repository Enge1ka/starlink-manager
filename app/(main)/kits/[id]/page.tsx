'use client'

import { useState, useEffect, use } from 'react'
import Header from '@/components/header'
import { useToast } from '@/components/toast'
import { formatDate, daysUntilExpiry } from '@/lib/utils'
import Link from 'next/link'

type Customer = { id: string; code: string; name: string }
type Kit = {
  id: string; kitName: string; serialNumber: string; dishId?: string; routerId?: string
  terminalId?: string; status: string; customerId?: string; customer?: Customer
  location?: string; installedDate?: string; billingType: string
  monthlyCost: number; expiryDate?: string; notes?: string; createdAt: string; updatedAt: string
}

const STATUSES = ['Active', 'Offline', 'Suspended', 'InStorage']
const KIT_STATUS_CLS: Record<string, string> = {
  Active: 'status-active', Offline: 'status-offline', Suspended: 'status-suspended', InStorage: 'status-instorage',
}

export default function KitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [kit, setKit] = useState<Kit | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [renewing, setRenewing] = useState(false)

  async function handleRenew() {
    setRenewing(true)
    try {
      const res = await fetch(`/api/kits/${id}/renew`, { method: 'POST' })
      if (res.ok) {
        const d = await res.json()
        setKit(d)
        toast('Expiry extended by 30 days')
      } else {
        toast('Failed to renew', 'error')
      }
    } catch { toast('Network error', 'error') }
    finally { setRenewing(false) }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/kits/${id}`).then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([k, c]) => {
      setKit(k)
      setCustomers(Array.isArray(c) ? c : [])
      setForm({
        kitName: k.kitName, dishId: k.dishId ?? '', routerId: k.routerId ?? '',
        terminalId: k.terminalId ?? '', status: k.status, customerId: k.customerId ?? '',
        location: k.location ?? '', billingType: k.billingType,
        monthlyCost: String(k.monthlyCost),
        installedDate: k.installedDate ? k.installedDate.split('T')[0] : '',
        expiryDate: k.expiryDate ? k.expiryDate.split('T')[0] : '',
        notes: k.notes ?? '',
      })
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/kits/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const d = await res.json(); setKit(d); toast('Kit updated'); setEditing(false) }
      else toast('Failed to save', 'error')
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
  if (!kit) return <div style={{ padding: '40px', textAlign: 'center', color: '#888888' }}>Kit not found. <Link href="/kits" style={{ color: '#6ec6ff' }}>Go back</Link></div>

  const days = daysUntilExpiry(kit.expiryDate)
  const expiryColor = days === null ? '#cccccc' : days < 0 ? '#ff4444' : days <= 3 ? '#ff8800' : days <= 7 ? '#ffcc00' : '#cccccc'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <Link href="/kits" style={{ color: '#888888', fontSize: '13px' }}>← Kits</Link>
        {!editing && <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">Edit</button>}
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{kit.kitName}</h2>
                <span className={`badge ${KIT_STATUS_CLS[kit.status] || 'status-instorage'}`}>
                  {kit.status === 'InStorage' ? 'In Storage' : kit.status}
                </span>
              </div>

              {editing ? (
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Kit Name', key: 'kitName', req: true },
                    { label: 'Dish ID', key: 'dishId' },
                    { label: 'Router ID', key: 'routerId' },
                    { label: 'Terminal / SIM ID', key: 'terminalId' },
                    { label: 'Location', key: 'location' },
                    { label: 'Monthly Cost (ZMW)', key: 'monthlyCost', type: 'number' },
                  ].map(({ label, key, req, type }) => (
                    <div key={key} className="form-group">
                      <label className="label">{label}</label>
                      <input type={type || 'text'} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} required={req} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="label">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s === 'InStorage' ? 'In Storage' : s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Billing Type</label>
                    <select value={form.billingType} onChange={e => setForm({ ...form, billingType: e.target.value })}>
                      <option value="ClientBilling">Client Billing</option>
                      <option value="CompanyBilling">Company Billing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Assigned Customer</label>
                    <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">— Unassigned —</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </div>
                  {[
                    { label: 'Installed Date', key: 'installedDate', type: 'date' },
                    { label: 'Expiry Date', key: 'expiryDate', type: 'date' },
                  ].map(({ label, key, type }) => (
                    <div key={key} className="form-group">
                      <label className="label">{label}</label>
                      <input type={type} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="label">Notes</label>
                    <textarea value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Serial Number', value: kit.serialNumber },
                    { label: 'Dish ID', value: kit.dishId },
                    { label: 'Router ID', value: kit.routerId },
                    { label: 'Terminal / SIM ID', value: kit.terminalId },
                    { label: 'Location', value: kit.location },
                    { label: 'Billing Type', value: kit.billingType === 'CompanyBilling' ? 'Company Billing' : 'Client Billing' },
                    { label: 'Monthly Cost', value: `K ${kit.monthlyCost.toLocaleString()}` },
                    { label: 'Installed', value: formatDate(kit.installedDate) },
                    { label: 'Created', value: formatDate(kit.createdAt) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#cccccc', fontFamily: label === 'Serial Number' ? 'monospace' : undefined }}>{value || '—'}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</span>
                    <span style={{ fontSize: '13px', color: expiryColor, fontWeight: 600 }}>
                      {formatDate(kit.expiryDate) || '—'}
                      {days !== null && days <= 7 && days >= 0 && ` (${days}d left)`}
                      {days !== null && days < 0 && ' — EXPIRED'}
                    </span>
                  </div>
                  {kit.customer && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</span>
                      <Link href={`/customers/${kit.customer.id}`} style={{ color: '#6ec6ff', fontSize: '13px' }}>
                        {kit.customer.code} — {kit.customer.name}
                      </Link>
                    </div>
                  )}
                  {kit.notes && (
                    <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '6px', padding: '10px', fontSize: '13px', color: '#888888' }}>
                      {kit.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Expiry Status</h3>
              <button onClick={handleRenew} disabled={renewing} className="btn btn-secondary btn-sm">
                {renewing ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : 'Renew +30 days'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                border: `3px solid ${expiryColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: expiryColor, lineHeight: 1 }}>
                  {days === null ? '?' : Math.abs(days)}
                </span>
                <span style={{ fontSize: '10px', color: '#555555' }}>days</span>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: expiryColor }}>
                  {days === null ? 'No expiry set' : days < 0 ? 'Expired' : days === 0 ? 'Expires today!' : `Expires in ${days} day${days !== 1 ? 's' : ''}`}
                </div>
                <div style={{ fontSize: '13px', color: '#888888', marginTop: '4px' }}>{formatDate(kit.expiryDate) || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
