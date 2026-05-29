'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { useToast } from '@/components/toast'

type Settings = {
  companyName: string; companyAddress: string; companyPhone: string; companyEmail: string
  bankAccountName: string; bankName: string; bankAccountNumber: string
  bankBranchName: string; bankBranchCode: string; bankSortCode: string; bankSwift: string
  invoicePrefix: string; invoiceNextNumber: number; defaultPaymentTerms: number
  defaultTaxPct: number; currency: string; currencySymbol: string
  showLogo: boolean; showBankDetails: boolean; showTaxColumn: boolean
  showDiscountColumn: boolean; showUnitColumn: boolean; showCodeColumn: boolean
  showShipTo: boolean; showTaxReference: boolean; showYourReference: boolean
  footerText: string; expiryWarningDays1: number; expiryWarningDays2: number
}

const DEFAULT: Settings = {
  companyName: '', companyAddress: '', companyPhone: '', companyEmail: '',
  bankAccountName: '', bankName: '', bankAccountNumber: '',
  bankBranchName: '', bankBranchCode: '', bankSortCode: '', bankSwift: '',
  invoicePrefix: 'INV', invoiceNextNumber: 1, defaultPaymentTerms: 0,
  defaultTaxPct: 0, currency: 'ZMW', currencySymbol: 'K',
  showLogo: true, showBankDetails: true, showTaxColumn: true,
  showDiscountColumn: true, showUnitColumn: true, showCodeColumn: true,
  showShipTo: false, showTaxReference: false, showYourReference: false,
  footerText: '', expiryWarningDays1: 7, expiryWarningDays2: 3,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #222222' }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {desc && <div className="toggle-desc">{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} className={`toggle-switch ${checked ? 'on' : 'off'}`}>
        <div className="toggle-knob" />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [s, setS] = useState<Settings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('company')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => { setS({ ...DEFAULT, ...data }); setLoading(false) })
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
      if (res.ok) toast('Settings saved successfully')
      else toast('Failed to save settings', 'error')
    } catch { toast('Network error', 'error') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'company', label: 'Company' },
    { id: 'bank', label: 'Bank Details' },
    { id: 'invoice', label: 'Invoice' },
    { id: 'alerts', label: 'Alerts' },
  ]

  if (loading) return (
    <>
      <Header />
      <div className="loading-center"><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header>
        <button onClick={save} className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? <span className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#000' }} /> : null}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </Header>
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

        {activeTab === 'company' && (
          <Section title="Company Information">
            <Field label="Company Name">
              <input value={s.companyName} onChange={e => set('companyName', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input value={s.companyPhone} onChange={e => set('companyPhone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" value={s.companyEmail} onChange={e => set('companyEmail', e.target.value)} />
            </Field>
            <Field label="Address">
              <textarea value={s.companyAddress} onChange={e => set('companyAddress', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </Field>
          </Section>
        )}

        {activeTab === 'bank' && (
          <Section title="Bank Details">
            <Field label="Account Name">
              <input value={s.bankAccountName} onChange={e => set('bankAccountName', e.target.value)} />
            </Field>
            <Field label="Bank Name">
              <input value={s.bankName} onChange={e => set('bankName', e.target.value)} />
            </Field>
            <Field label="Account Number">
              <input value={s.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} />
            </Field>
            <Field label="Branch Name">
              <input value={s.bankBranchName} onChange={e => set('bankBranchName', e.target.value)} />
            </Field>
            <Field label="Branch Code">
              <input value={s.bankBranchCode} onChange={e => set('bankBranchCode', e.target.value)} />
            </Field>
            <Field label="Branch Sort Code">
              <input value={s.bankSortCode} onChange={e => set('bankSortCode', e.target.value)} />
            </Field>
            <Field label="SWIFT Code">
              <input value={s.bankSwift} onChange={e => set('bankSwift', e.target.value)} />
            </Field>
          </Section>
        )}

        {activeTab === 'invoice' && (
          <>
            <Section title="Invoice Numbering">
              <Field label="Invoice Prefix">
                <input value={s.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} />
              </Field>
              <Field label="Next Invoice Number">
                <input type="number" min={1} value={s.invoiceNextNumber} onChange={e => set('invoiceNextNumber', Number(e.target.value))} />
              </Field>
              <Field label="Default Payment Terms (days)">
                <input type="number" min={0} value={s.defaultPaymentTerms} onChange={e => set('defaultPaymentTerms', Number(e.target.value))} />
              </Field>
              <Field label="Default Tax %">
                <input type="number" min={0} max={100} step={0.01} value={s.defaultTaxPct} onChange={e => set('defaultTaxPct', Number(e.target.value))} />
              </Field>
              <Field label="Currency Code">
                <input value={s.currency} onChange={e => set('currency', e.target.value)} />
              </Field>
              <Field label="Currency Symbol">
                <input value={s.currencySymbol} onChange={e => set('currencySymbol', e.target.value)} />
              </Field>
            </Section>
            <div className="card">
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Invoice Display Options</h3>
              <p style={{ color: '#555555', fontSize: '12px', marginBottom: '16px' }}>Control what information appears on generated invoices.</p>
              <Toggle label="Show Logo" desc="Display company logo on invoice" checked={s.showLogo} onChange={v => set('showLogo', v)} />
              <Toggle label="Show Bank Details" desc="Show bank details section at bottom" checked={s.showBankDetails} onChange={v => set('showBankDetails', v)} />
              <Toggle label="Show Code Column" desc="Show item code column in line items" checked={s.showCodeColumn} onChange={v => set('showCodeColumn', v)} />
              <Toggle label="Show Unit Column" desc="Show unit column in line items" checked={s.showUnitColumn} onChange={v => set('showUnitColumn', v)} />
              <Toggle label="Show Tax Column" desc="Show tax % column in line items" checked={s.showTaxColumn} onChange={v => set('showTaxColumn', v)} />
              <Toggle label="Show Discount Column" desc="Show discount % column in line items" checked={s.showDiscountColumn} onChange={v => set('showDiscountColumn', v)} />
              <Toggle label="Show Ship To" desc="Show Ship To field on invoice" checked={s.showShipTo} onChange={v => set('showShipTo', v)} />
              <Toggle label="Show Your Reference" desc="Show Your Reference field" checked={s.showYourReference} onChange={v => set('showYourReference', v)} />
              <Toggle label="Show Tax Reference" desc="Show Tax Reference field" checked={s.showTaxReference} onChange={v => set('showTaxReference', v)} />
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="label">Invoice Footer Text</label>
                <textarea value={s.footerText} onChange={e => set('footerText', e.target.value)} rows={2} placeholder="Optional footer message on invoices..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="card">
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Kit Expiry Alert Thresholds</h3>
            <p style={{ color: '#555555', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
              Set how many days before expiry kits should be flagged on the dashboard. Kits past their expiry date are always shown.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px', marginBottom: '24px' }}>
              <Field label="Warning Alert (days)">
                <input type="number" min={1} value={s.expiryWarningDays1} onChange={e => set('expiryWarningDays1', Number(e.target.value))} />
              </Field>
              <Field label="Critical Alert (days)">
                <input type="number" min={1} value={s.expiryWarningDays2} onChange={e => set('expiryWarningDays2', Number(e.target.value))} />
              </Field>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { color: '#ffcc00', label: 'Yellow warning', days: s.expiryWarningDays1, suffix: 'days' },
                { color: '#ff8800', label: 'Orange critical', days: s.expiryWarningDays2, suffix: 'days' },
                { color: '#ff4444', label: 'Red expired', days: null, suffix: '' },
              ].map(({ color, label, days, suffix }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cccccc' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  <span>{label}{days !== null ? ` — kit expiring within ` : ' — kit is past expiry date'}</span>
                  {days !== null && <strong style={{ color: '#ffffff' }}>{days} {suffix}</strong>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
