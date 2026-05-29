'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(d => {
        if (d.needsSetup) router.replace('/setup')
        else setChecking(false)
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '20px', height: '20px' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ height: '60px', background: '#111111', borderBottom: '1px solid #222222', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#000' }}>📡</div>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>Starlink Manager</span>
        </div>
      </div>

      {/* Login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }} className="slide-up">
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>Sign in</h1>
            <p style={{ fontSize: '13px', color: '#888888' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="label">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

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
              {loading ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000' }} /> : 'Sign In'}
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
