'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', width: '100%', maxWidth: `${width}px`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        className="slide-up"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #222222', flexShrink: 0 }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{title}</h2>
          <button onClick={onClose} className="btn-icon" style={{ fontSize: '16px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: '20px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
