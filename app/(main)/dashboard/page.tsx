'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { formatDate, daysUntilExpiry } from '@/lib/utils'
import Link from 'next/link'

type Kit = { id: string; kitName: string; expiryDate?: string; customer?: { id: string; name: string } }
type RecentInvoice = { id: string; invoiceNumber: string; total: number; status: string; createdAt: string; customer: { id: string; name: string } }
type RecentPayment = { id: string; amount: number; paymentDate: string; method?: string; invoice: { invoiceNumber: string; customer: { name: string } } }

type DashData = {
  kits: { total: number; active: number }
  customers: { total: number }
  invoices: { total: number; overdue: number; pending: number; paid: number }
  expiring: { expired: Kit[]; critical: Kit[]; warning: Kit[] }
  recentInvoices: RecentInvoice[]
  recentPayments: RecentPayment[]
  revenue: { total: number; collected: number; outstanding: number }
  settings: { warn1: number; warn2: number; currencySymbol: string }
}

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  Pending: { cls: 'status-pending', label: 'Pending' },
  Paid: { cls: 'status-paid', label: 'Paid' },
  PartiallyPaid: { cls: 'status-partial', label: 'Partial' },
  Overdue: { cls: 'status-overdue', label: 'Overdue' },
}

function ExpiryAlert({ kits, label, colorCls }: { kits: Kit[]; label: string; colorCls: string }) {
  if (kits.length === 0) return null
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }} className={colorCls}>
        {label} ({kits.length})
      </div>
      {kits.map(k => {
        const days = daysUntilExpiry(k.expiryDate)
        return (
          <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#111111', borderRadius: '6px', marginBottom: '4px', border: '1px solid #1e1e1e' }}>
            <div>
              <Link href={`/kits/${k.id}`} style={{ fontSize: '13px', fontWeight: 500, color: '#cccccc' }}>{k.kitName}</Link>
              {k.customer && <span style={{ fontSize: '11px', color: '#555555', marginLeft: '8px' }}>{k.customer.name}</span>}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700 }} className={colorCls}>
              {days === null ? '—' : days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Today' : `${days}d`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <>
      <Header />
      <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
    </>
  )

  if (!data) return null
  const sym = data.settings.currencySymbol
  const totalExpiring = data.expiring.expired.length + data.expiring.critical.length + data.expiring.warning.length

  return (
    <>
      <Header />
      <div className="page-body">

        {/* Alert banner for expiring kits */}
        {totalExpiring > 0 && (
          <div className="alert-banner">
            <span>⚠</span>
            <span>{totalExpiring} kit{totalExpiring > 1 ? 's' : ''} require attention — </span>
            <Link href="/kits">view fleet →</Link>
          </div>
        )}

        <div className="page-title">Overview</div>
        <div className="page-subtitle">Operational snapshot for your Starlink fleet.</div>

        {/* Revenue balance card */}
        <div className="balance-card">
          <div>
            <div className="balance-label">Outstanding Balance</div>
            <div className="balance-amount">{sym} {data.revenue.outstanding.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Collected</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#aaaaaa' }}>{sym} {data.revenue.collected.toLocaleString()}</div>
            </div>
            <Link href="/invoices" className="btn btn-primary">
              View Invoices
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Active Kits', value: data.kits.active, sub: `of ${data.kits.total} total`, href: '/kits' },
            { label: 'Customers', value: data.customers.total, sub: 'active accounts', href: '/customers' },
            { label: 'Pending', value: data.invoices.pending, sub: 'awaiting payment', href: '/invoices' },
            { label: 'Overdue', value: data.invoices.overdue, sub: 'past due date', href: '/invoices' },
            { label: 'Revenue', value: `${sym} ${data.revenue.total.toLocaleString()}`, sub: 'total invoiced', href: '/reports' },
          ].map(({ label, value, sub, href }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                <div className="stat-sub">{sub}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Recent invoices */}
            <div className="table-wrap">
              <div className="card-header">
                <span className="card-header-title">Recent Invoices</span>
                <Link href="/invoices" style={{ fontSize: '12px', color: '#555555', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>View all →</Link>
              </div>
              {data.recentInvoices.length === 0 ? (
                <div className="empty-state">No invoices yet</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      {['Invoice #', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInvoices.map(inv => {
                      const sc = STATUS_CFG[inv.status] || STATUS_CFG.Pending
                      return (
                        <tr key={inv.id}>
                          <td><Link href={`/invoices/${inv.id}`} style={{ color: '#ffffff', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                          <td style={{ color: '#aaaaaa' }}>{inv.customer.name}</td>
                          <td style={{ fontWeight: 500 }}>{sym} {inv.total.toLocaleString()}</td>
                          <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                          <td style={{ color: '#555555' }}>{formatDate(inv.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent payments */}
            <div className="table-wrap">
              <div className="card-header">
                <span className="card-header-title">Recent Payments</span>
                <Link href="/payments" style={{ fontSize: '12px', color: '#555555', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>View all →</Link>
              </div>
              {data.recentPayments.length === 0 ? (
                <div className="empty-state">No payments yet</div>
              ) : (
                <table>
                  <tbody>
                    {data.recentPayments.map(p => (
                      <tr key={p.id}>
                        <td style={{ color: '#cccccc' }}>{p.invoice.customer.name}</td>
                        <td style={{ color: '#555555', fontSize: '12px' }}>{p.invoice.invoiceNumber}</td>
                        <td style={{ fontWeight: 700, color: '#aaaaaa' }}>{sym} {p.amount.toLocaleString()}</td>
                        <td><span className="badge status-paid">{p.method || '—'}</span></td>
                        <td style={{ color: '#555555', fontSize: '12px' }}>{formatDate(p.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick access grid */}
            <div className="dashboard-grid">
              {[
                { href: '/customers/new' as never, label: 'New Customer', desc: 'Register a client account', icon: '👤' },
                { href: '/kits' as never, label: 'Manage Fleet', desc: `${data.kits.active} kits active`, icon: '📡' },
                { href: '/invoices/new' as never, label: 'Create Invoice', desc: 'Generate a new tax invoice', icon: '🧾' },
                { href: '/reports' as never, label: 'View Reports', desc: 'Revenue & balance reports', icon: '📊' },
              ].map(({ href, label, desc, icon }) => (
                <Link key={label} href={href} className="grid-card">
                  <div className="card-icon">{icon}</div>
                  <div>
                    <h3>{label}</h3>
                    <p>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Expiry panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
                Kit Expiry Alerts
              </div>
              {totalExpiring === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#555555', fontSize: '13px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>✓</div>
                  All kits are current
                </div>
              ) : (
                <>
                  <ExpiryAlert kits={data.expiring.expired} label="Expired" colorCls="expiry-expired" />
                  <ExpiryAlert kits={data.expiring.critical} label={`Within ${data.settings.warn2}d`} colorCls="expiry-critical" />
                  <ExpiryAlert kits={data.expiring.warning} label={`Within ${data.settings.warn1}d`} colorCls="expiry-warning" />
                </>
              )}
              <Link href="/kits" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', display: 'flex' }}>
                Manage Fleet
              </Link>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px', color: '#ffffff' }}>Invoices</div>
              {[
                { label: 'Total', value: data.invoices.total },
                { label: 'Paid', value: data.invoices.paid },
                { label: 'Pending', value: data.invoices.pending },
                { label: 'Overdue', value: data.invoices.overdue },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e1e1e', fontSize: '13px' }}>
                  <span style={{ color: '#666666' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
