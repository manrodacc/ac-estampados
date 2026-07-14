import { forwardRef } from 'react'
import { formatMoney, formatDate } from '../lib/format'

const CotizacionTemplate = forwardRef(({ resumen, cliente, items }, ref) => {
  if (!resumen || !cliente) return null

  const isDark = true
  const bgMain = '#0f0f13'
  const bgCard = '#1a1a24'
  const textPrimary = '#ffffff'
  const textSecondary = '#8b8b9c'
  const accentGold = '#d4af37'
  const borderColor = '#2a2a35'

  return (
    <div 
      ref={ref}
      style={{
        width: '800px', // Ancho fijo para buena resolución de la imagen
        padding: '40px',
        backgroundColor: bgMain,
        color: textPrimary,
        fontFamily: "'Inter', 'Outfit', sans-serif",
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${borderColor}`, paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src="/ac-estampados.jpeg" alt="AC Estampados Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: accentGold, letterSpacing: '-0.5px' }}>AC Estampados</h1>
            <p style={{ margin: 0, color: textSecondary, fontSize: '16px', marginTop: '4px' }}>Expertos en personalización textil</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '40px', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>COTIZACIÓN</h2>
          <p style={{ margin: 0, fontSize: '16px', color: textSecondary, marginTop: '8px' }}>
            Fecha: <span style={{ color: textPrimary }}>{formatDate(new Date().toISOString())}</span>
          </p>
          <p style={{ margin: 0, fontSize: '16px', color: textSecondary, marginTop: '4px' }}>
            Nº Pedido: <span style={{ color: textPrimary }}>#{resumen.pedido_id?.slice(0, 8) || '0001'}</span>
          </p>
        </div>
      </div>

      {/* Client Info & Order Info */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        <div style={{ flex: 1, backgroundColor: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: accentGold, textTransform: 'uppercase', letterSpacing: '1px' }}>Datos del Cliente</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>{cliente.nombre}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: '15px', color: textSecondary }}>Teléfono: <span style={{ color: textPrimary }}>{cliente.telefono || '—'}</span></p>
          <p style={{ margin: 0, fontSize: '15px', color: textSecondary }}>Dirección: <span style={{ color: textPrimary }}>{cliente.direccion || '—'}</span></p>
        </div>
        
        <div style={{ flex: 1, backgroundColor: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: accentGold, textTransform: 'uppercase', letterSpacing: '1px' }}>Detalles del Pedido</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>{resumen.titulo || 'Sin título'}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: '15px', color: textSecondary }}>Entrega estimada: <span style={{ color: textPrimary }}>{resumen.fecha_entrega_estimada ? formatDate(resumen.fecha_entrega_estimada) : 'Por definir'}</span></p>
          <p style={{ margin: 0, fontSize: '15px', color: textSecondary }}>Estado actual: <span style={{ color: textPrimary, textTransform: 'capitalize' }}>{resumen.estado}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr', gap: '16px', padding: '16px', borderBottom: `2px solid ${accentGold}`, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px 12px 0 0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: accentGold }}>DESCRIPCIÓN</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: accentGold, textAlign: 'center' }}>CANT.</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: accentGold, textAlign: 'right' }}>PRECIO U.</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: accentGold, textAlign: 'right' }}>SUBTOTAL</div>
        </div>
        
        <div style={{ border: `1px solid ${borderColor}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr', gap: '16px', padding: '20px 16px', borderBottom: i < items.length - 1 ? `1px solid ${borderColor}` : 'none', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <div>
                <p style={{ margin: '0 0 6px 0', fontWeight: '600', fontSize: '16px' }}>{it.prenda}</p>
                <p style={{ margin: 0, fontSize: '13px', color: textSecondary }}>
                  {[
                    it.talla && `Talla: ${it.talla}`,
                    it.color && `Color: ${it.color}`,
                    it.tipo_prenda && `Corte: ${it.tipo_prenda}`,
                    it.calidad_tela && `Tela: ${it.calidad_tela}`
                  ].filter(Boolean).join(' • ')}
                </p>
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px' }}>{it.cantidad}</div>
              <div style={{ textAlign: 'right', fontSize: '16px' }}>{formatMoney(it.precio_unitario || (it.subtotal / it.cantidad))}</div>
              <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: textPrimary }}>{formatMoney(it.subtotal)}</div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: textSecondary }}>
              No hay prendas detalladas.
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '350px', backgroundColor: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px' }}>
            <span style={{ color: textSecondary }}>Subtotal</span>
            <span>{formatMoney(resumen.costo_total)}</span>
          </div>
          {resumen.total_pagado > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px' }}>
              <span style={{ color: textSecondary }}>Abono / Adelanto</span>
              <span style={{ color: '#10b981' }}>- {formatMoney(resumen.total_pagado)}</span>
            </div>
          )}
          <div style={{ height: '1px', backgroundColor: borderColor, margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: accentGold }}>Total a Pagar</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: accentGold }}>{formatMoney(resumen.costo_total - resumen.total_pagado)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '32px', borderTop: `1px solid ${borderColor}` }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: accentGold }}>¡Gracias por tu preferencia!</p>
        <p style={{ margin: 0, fontSize: '14px', color: textSecondary }}>
          Cotización generada digitalmente. Sujeta a disponibilidad de stock al momento del pago.
        </p>
      </div>
    </div>
  )
})

CotizacionTemplate.displayName = 'CotizacionTemplate'
export default CotizacionTemplate
