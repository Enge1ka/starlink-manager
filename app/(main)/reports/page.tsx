'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type OutstandingInvoice = { id: string; invoiceNumber: string; dueDate: string; total: number; balance: number; status: string; customer: { id: string; code: string; name: string } }
type CustomerBalance = { id: string; code: string; name: string; totalInvoiced: number; totalPaid: number; totalBalance: number; invoiceCount: number; overdueCount: number }
type KitStatus = { status?: string; billingType?: string; _count: { id: number }; _sum: { monthlyCost: number } }
type MonthlyData = { month: string; amount: number }

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  Pending: { cls: 'status-pending', label: 'Pending' },
  Paid: { cls: 'status-paid', label: 'Paid' },
  PartiallyPaid: { cls: 'status-partial', label: 'Partial' },
  Overdue: { cls: 'status-overdue', label: 'Overdue' },
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('outstanding')
  const [outstanding, setOutstanding] = useState<OutstandingInvoice[]>([])
  const [balances, setBalances] = useState<CustomerBalance[]>([])
  const [kitStatus, setKitStatus] = useState<{ byStatus: KitStatus[]; byBilling: KitStatus[] } | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(false)

  async function loadTab(tab: string) {
    setLoading(true)
    const res = await fetch(`/api/reports?type=${tab}`)
    const data = await res.json()
    if (tab === 'outstanding') setOutstanding(Array.isArray(data) ? data : [])
    else if (tab === 'customer-balances') setBalances(Array.isArray(data) ? data : [])
    else if (tab === 'kit-status') setKitStatus(data)
    else if (tab === 'monthly-revenue') setMonthly(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadTab(activeTab) }, [activeTab])

  const TABS = [
    { id: 'outstanding', label: 'Outstanding Invoices' },
    { id: 'customer-balances', label: 'Customer Balances' },
    { id: 'kit-status', label: 'Kit Status' },
    { id: 'monthly-revenue', label: 'Monthly Revenue' },
  ]

  const maxRevenue = Math.max(...monthly.map(m => m.amount), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
        ) : (
          <>
            {activeTab === 'outstanding' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Outstanding Count</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4444' }}>{outstanding.length}</div>
                  </div>
                  <div className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total Outstanding</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4444' }}>K {outstanding.reduce((s, i) => s + i.balance, 0).toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Overdue</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4444' }}>{outstanding.filter(i => i.status === 'Overdue').length}</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {['Invoice #', 'Customer', 'Due Date', 'Invoice Total', 'Balance Due', 'Status'].map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#555555' }}>✓ No outstanding invoices</td></tr>
                      ) : outstanding.map(inv => {
                        const sc = STATUS_CFG[inv.status] || STATUS_CFG.Pending
                        return (
                          <tr key={inv.id}>
                            <td><Link href={`/invoices/${inv.id}`} style={{ color: '#6ec6ff', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                            <td style={{ color: '#ffffff' }}>{inv.customer.name}</td>
                            <td>{formatDate(inv.dueDate)}</td>
                            <td style={{ color: '#ffffff' }}>K {inv.total.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: '#ff4444' }}>K {inv.balance.toLocaleString()}</td>
                            <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'customer-balances' && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {['Code', 'Customer', 'Invoices', 'Total Invoiced', 'Total Paid', 'Balance', 'Overdue'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {balances.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#555555' }}>No customer data</td></tr>
                    ) : balances.map(c => (
                      <tr key={c.id}>
                        <td style={{ color: '#6ec6ff', fontWeight: 600 }}>{c.code}</td>
                        <td><Link href={`/customers/${c.id}`} style={{ color: '#ffffff' }}>{c.name}</Link></td>
                        <td style={{ textAlign: 'center' }}>{c.invoiceCount}</td>
                        <td style={{ color: '#ffffff' }}>K {c.totalInvoiced.toLocaleString()}</td>
                        <td style={{ color: '#aaaaaa' }}>K {c.totalPaid.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: c.totalBalance > 0 ? '#ff4444' : '#555555' }}>K {c.totalBalance.toLocaleString()}</td>
                        <td>
                          {c.overdueCount > 0
                            ? <span className="badge status-overdue">{c.overdueCount} overdue</span>
                            : <span style={{ color: '#555555' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'kit-status' && kitStatus && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card">
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Kits by Status</h3>
                  {kitStatus.byStatus.map(row => (
                    <div key={row.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e1e1e' }}>
                      <span style={{ fontSize: '13px', color: '#cccccc' }}>{row.status === 'InStorage' ? 'In Storage' : row.status}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{row._count.id}</span>
                        <span style={{ fontSize: '12px', color: '#555555', marginLeft: '8px' }}>K {(row._sum.monthlyCost || 0).toLocaleString()}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Kits by Billing Type</h3>
                  {kitStatus.byBilling.map(row => (
                    <div key={row.billingType || row.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e1e1e' }}>
                      <span style={{ fontSize: '13px', color: '#cccccc' }}>{row.billingType === 'CompanyBilling' ? 'Company Billing' : 'Client Billing'}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{row._count.id}</span>
                        <span style={{ fontSize: '12px', color: '#555555', marginLeft: '8px' }}>K {(row._sum.monthlyCost || 0).toLocaleString()}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'monthly-revenue' && (
              <div className="card">
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Monthly Revenue (from payments)</h3>
                {monthly.length === 0 ? (
                  <div className="empty-state">No payment data yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {monthly.slice(-12).map(m => (
                      <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '12px', color: '#555555', width: '64px', flexShrink: 0 }}>{m.month}</span>
                        <div style={{ flex: 1, background: '#111111', borderRadius: '4px', height: '18px', position: 'relative', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px',
                            background: '#ffffff',
                            width: `${(m.amount / maxRevenue) * 100}%`,
                            opacity: 0.15,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, width: '120px', textAlign: 'right', flexShrink: 0, color: '#ffffff' }}>
                          K {m.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
