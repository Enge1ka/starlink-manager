'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  userName?: string
}

export default function Navbar({ userName = 'A' }: NavbarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const initials = userName.slice(0, 2).toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="navbar-logo-icon">📡</div>
        <span>Starlink Manager</span>
      </div>

      <div className="navbar-actions">
        <button
          className="icon-btn"
          title="Sign out"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ fontSize: '14px', gap: '6px', display: 'flex', alignItems: 'center' }}
        >
          {loggingOut ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '⎋'}
        </button>
        <div className="avatar-btn" title={userName}>
          {initials}
        </div>
      </div>
    </nav>
  )
}
