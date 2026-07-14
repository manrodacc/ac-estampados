import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      <div 
        className="animate-slide-up"
        style={{ 
          position: 'relative', 
          backgroundColor: 'var(--bg-card)', 
          width: '100%', 
          maxWidth: '600px', 
          borderTopLeftRadius: '24px', 
          borderTopRightRadius: '24px',
          padding: '24px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          boxShadow: '0 -10px 25px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain'
        }}
      >
        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', margin: '0 auto 20px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}