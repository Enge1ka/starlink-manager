'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const colors = {
    success: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: '#ffffff' },
    error: { bg: 'rgba(255,68,68,0.12)', border: 'rgba(255,68,68,0.3)', color: '#ff4444' },
    info: { bg: 'rgba(110,198,255,0.1)', border: 'rgba(110,198,255,0.3)', color: '#6ec6ff' },
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((t) => {
          const c = colors[t.type]
          return (
            <div key={t.id} className="slide-up" style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '280px',
              maxWidth: '380px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <span style={{ color: c.color, fontWeight: 700, fontSize: '14px' }}>{icons[t.type]}</span>
              <span style={{ fontSize: '13px', color: '#cccccc', flex: 1 }}>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
