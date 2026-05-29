'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/kits': 'Fleet',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

function getTitle(pathname: string): string {
  for (const [key, val] of Object.entries(TITLES)) {
    if (pathname === key || pathname.startsWith(key + '/')) return val
  }
  return 'Starlink Manager'
}

export default function Header({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="page-header">
      <h1 className="page-header-title">{getTitle(pathname)}</h1>
      {children && (
        <div className="page-header-actions">{children}</div>
      )}
    </div>
  )
}
