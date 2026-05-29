'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import Modal from '@/components/modal'
import Confirm from '@/components/confirm'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Customer = {
  id: string; code: string; name: string; company?: string; phone?: string
  email?: string; address?: string; tpin?: string; notes?: string; isActive: boolean
  createdAt: string; _count: { kits: number; invoices: number }
}

const EMPTY = { code: '', name: '', company: '', phone: '', email: '', address: '', tpin: '', notes: '' }

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async (q = '') => {
    setLoading(true)
    const res = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  function openCreate() { setEditCustomer(null); setForm(EMPTY); setShowModal(true) }

  function openEdit(c: Customer) {
    setEditCustomer(c)
    setForm({ code: c.code, name: c.name, company: c.company ?? '', phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '', tpin: c.tpin ?? '', notes: c.notes ?? '' })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editCustomer ? `/api/customers/${editCustomer.id}` : '/api/customers'
      const method = editCustomer ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to save', 'error'); return }
      toast(editCustomer ? 'Customer updated' : 'Customer created')
      setShowModal(false); load(search)
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleting) return; setDeleteLoading(true)
    try {
      const res = await fetch(`/api/customers/${deleting.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Delete failed', 'error') }
      else { toast('Customer deleted'); load(search) }
    } catch { toast('Network error', 'error') }
    finally { setDeleteLoading(false); setDeleting(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ New Customer</button>
      </Header>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div className="filter-row">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ maxWidth: '320px' }} />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            {search ? 'No customers match your search.' : 'No customers yet. Click "+ New Customer" to add one.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Code', 'Name', 'Company', 'Phone', 'Kits', 'Invoices', 'Status', 'Since', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/customers/${c.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{c.code}</Link>
                    </td>
                    <td style={{ fontWeight: 500, color: '#ffffff' }}>{c.name}</td>
                    <td>{c.company || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{c._count.kits}</td>
                    <td style={{ textAlign: 'center' }}>{c._count.invoices}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'status-active' : 'status-instorage'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEdit(c)} className="btn-icon" title="Edit">✏</button>
                        <button onClick={() => setDeleting(c)} className="btn-icon" title="Delete" style={{ color: '#ff4444' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Edit Customer' : 'New Customer'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Customer Code *</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. W001" required disabled={!!editCustomer} />
            </div>
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. William Nyirenda" required />
            </div>
            <div className="form-group">
              <label className="label">Company Name</label>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+260 9X XXX XXXX" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" />
            </div>
            <div className="form-group">
              <label className="label">TPIN / NRC</label>
              <input value={form.tpin} onChange={e => setForm({ ...form, tpin: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000' }} /> : null}
              {editCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!deleting} title="Delete Customer" message={`Delete "${deleting?.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
    </div>
  )
}
