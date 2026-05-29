'use client'

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
  loading?: boolean
}

export default function Confirm({ open, title, message, onConfirm, onCancel, danger = true, loading = false }: ConfirmProps) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', width: '100%', maxWidth: '360px', padding: '24px' }} className="slide-up">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>{title}</h3>
        <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
