'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import Modal from '@/components/modal'
import Confirm from '@/components/confirm'
import { useToast } from '@/components/toast'
import { formatDate, daysUntilExpiry } from '@/lib/utils'
import Link from 'next/link'

type Customer = { id: string; code: string; name: string }
type Kit = {
  id: string; kitName: string; serialNumber: string; status: string
  customerId?: string; customer?: Customer; location?: string
  installedDate?: string; billingType: string; monthlyCost: number
  expiryDate?: string; notes?: string; dishId?: string; routerId?: string; terminalId?: string
}

const STATUSES = ['Active', 'Offline', 'Suspended', 'InStorage']
const KIT_STATUS_CLS: Record<string, string> = {
  Active: 'status-active',
  Offline: 'status-offline',
  Suspended: 'status-suspended',
  InStorage: 'status-instorage',
}

const EMPTY = { kitName: '', serialNumber: '', dishId: '', routerId: '', terminalId: '', status: 'Active', customerId: '', location: '', installedDate: '', billingType: 'ClientBilling', monthlyCost: '', expiryDate: '', notes: '' }

function ExpiryBadge({ date }: { date?: string }) {
  if (!date) return <span style={{ color: '#555555', fontSize: '12px' }}>—</span>
  const days = daysUntilExpiry(date)
  const fmt = formatDate(date)
  if (days === null) return <span style={{ fontSize: '12px' }}>{fmt}</span>
  const color = days < 0 ? '#ff4444' : days <= 3 ? '#ff8800' : days <= 7 ? '#ffcc00' : '#cccccc'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '12px', color }}>{fmt}</span>
      {days < 0
        ? <span style={{ fontSize: '10px', color: '#ff4444', fontWeight: 700 }}>EXPIRED</span>
        : days <= 7
          ? <span style={{ fontSize: '10px', color, fontWeight: 700 }}>{days}d left</span>
          : null}
    </div>
  )
}

export default function KitsPage() {
  const { toast } = useToast()
  const [kits, setKits] = useState<Kit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editKit, setEditKit] = useState<Kit | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Kit | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [renewingId, setRenewingId] = useState<string | null>(null)

  async function handleRenew(k: Kit) {
    setRenewingId(k.id)
    try {
      const res = await fetch(`/api/kits/${k.id}/renew`, { method: 'POST' })
      if (res.ok) { toast(`${k.kitName} renewed +30 days`); load() }
      else toast('Failed to renew', 'error')
    } catch { toast('Network error', 'error') }
    finally { setRenewingId(null) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filterStatus) params.set('status', filterStatus)
    const res = await fetch(`/api/kits?${params}`)
    const data = await res.json()
    setKits(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])) }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  function openCreate() { setEditKit(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(k: Kit) {
    setEditKit(k)
    setForm({
      kitName: k.kitName, serialNumber: k.serialNumber, dishId: k.dishId ?? '', routerId: k.routerId ?? '',
      terminalId: k.terminalId ?? '', status: k.status, customerId: k.customerId ?? '',
      location: k.location ?? '', installedDate: k.installedDate ? k.installedDate.split('T')[0] : '',
      billingType: k.billingType, monthlyCost: String(k.monthlyCost),
      expiryDate: k.expiryDate ? k.expiryDate.split('T')[0] : '', notes: k.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editKit ? `/api/kits/${editKit.id}` : '/api/kits'
      const method = editKit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed', 'error'); return }
      toast(editKit ? 'Kit updated' : 'Kit created'); setShowModal(false); load()
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleting) return; setDeleteLoading(true)
    try {
      const res = await fetch(`/api/kits/${deleting.id}`, { method: 'DELETE' })
      if (res.ok) { toast('Kit deleted'); load() }
      else { const d = await res.json(); toast(d.error ?? 'Delete failed', 'error') }
    } catch { toast('Network error', 'error') }
    finally { setDeleteLoading(false); setDeleting(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ New Kit</button>
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div className="filter-row">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search kits..." style={{ width: '240px' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'InStorage' ? 'In Storage' : s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
        ) : kits.length === 0 ? (
          <div className="empty-state">No kits found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Kit Name', 'Serial No.', 'Status', 'Customer', 'Billing', 'Monthly Cost', 'Expiry', 'Location', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kits.map(k => (
                  <tr key={k.id}>
                    <td>
                      <Link href={`/kits/${k.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{k.kitName}</Link>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{k.serialNumber}</td>
                    <td>
                      <span className={`badge ${KIT_STATUS_CLS[k.status] || 'status-instorage'}`}>
                        {k.status === 'InStorage' ? 'In Storage' : k.status}
                      </span>
                    </td>
                    <td>
                      {k.customer
                        ? <Link href={`/customers/${k.customer.id}`} style={{ color: '#ffffff' }}>{k.customer.name}</Link>
                        : <span style={{ color: '#555555' }}>—</span>}
                    </td>
                    <td>{k.billingType === 'CompanyBilling' ? 'Company' : 'Client'}</td>
                    <td style={{ color: '#ffffff', fontWeight: 500 }}>K {k.monthlyCost.toLocaleString()}</td>
                    <td><ExpiryBadge date={k.expiryDate} /></td>
                    <td>{k.location || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleRenew(k)} disabled={renewingId === k.id} className="btn-icon" title="Renew +30 days" style={{ color: '#6ec6ff' }}>
                          {renewingId === k.id ? <span className="spinner" style={{ width: '10px', height: '10px' }} /> : '↻'}
                        </button>
                        <button onClick={() => openEdit(k)} className="btn-icon">✏</button>
                        <button onClick={() => setDeleting(k)} className="btn-icon" style={{ color: '#ff4444' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editKit ? 'Edit Kit' : 'New Kit'} width={600}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Kit Name *</label>
              <input value={form.kitName} onChange={e => setForm({ ...form, kitName: e.target.value })} placeholder="e.g. Office-01" required />
            </div>
            <div className="form-group">
              <label className="label">Serial Number *</label>
              <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="Starlink serial" required disabled={!!editKit} />
            </div>
            <div className="form-group">
              <label className="label">Dish ID</label>
              <input value={form.dishId} onChange={e => setForm({ ...form, dishId: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Router ID</label>
              <input value={form.routerId} onChange={e => setForm({ ...form, routerId: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Terminal / SIM ID</label>
              <input value={form.terminalId} onChange={e => setForm({ ...form, terminalId: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s === 'InStorage' ? 'In Storage' : s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Assigned Customer</label>
              <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">— Unassigned —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
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
              <label className="label">Monthly Cost (ZMW)</label>
              <input type="number" min="0" step="0.01" value={form.monthlyCost} onChange={e => setForm({ ...form, monthlyCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Head Office" />
            </div>
            <div className="form-group">
              <label className="label">Installed Date</label>
              <input type="date" value={form.installedDate} onChange={e => setForm({ ...form, installedDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000' }} /> : null}
              {editKit ? 'Save Changes' : 'Create Kit'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!deleting} title="Delete Kit" message={`Delete kit "${deleting?.kitName}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
    </div>
  )
}
