'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/kits', label: 'Fleet', icon: '📡' },
  { href: '/invoices', label: 'Invoices', icon: '🧾' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/reports', label: 'Reports', icon: '📊' },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <ul>
          {NAV.map(({ href, label, icon }) => (
            <li key={href} className={isActive(href) ? 'active' : ''}>
              <Link href={href}>
                <span className="icon">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-bottom">
        <ul>
          {BOTTOM_NAV.map(({ href, label, icon }) => (
            <li key={href} className={isActive(href) ? 'active' : ''}>
              <Link href={href}>
                <span className="icon">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
