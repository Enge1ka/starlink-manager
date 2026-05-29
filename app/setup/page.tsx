'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, username: form.username, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Setup failed')
      } else {
        router.push('/login')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '60px', background: '#111111', borderBottom: '1px solid #222222', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#000' }}>📡</div>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>Starlink Manager</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }} className="slide-up">
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>First-Time Setup</h1>
            <p style={{ fontSize: '13px', color: '#888888' }}>Create your administrator account to get started.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. John Banda' },
              { label: 'Username', key: 'username', type: 'text', placeholder: 'e.g. admin' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' },
              { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: 'Repeat password' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className="form-group">
                <label className="label">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ff4444' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: '40px', marginTop: '4px', fontSize: '14px' }}
            >
              {loading ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000' }} /> : 'Create Account & Continue'}
            </button>
          </form>
        </div>
      </div>

      <footer style={{ background: '#111111', borderTop: '1px solid #222222', padding: '16px 32px', fontSize: '12px', color: '#555555', textAlign: 'center' }}>
        Starlink Manager — Internal Operations System
      </footer>
    </div>
  )
}
