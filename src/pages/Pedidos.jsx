import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney, formatDate, ESTADOS } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    cargarPedidos()
  }, [])

  async function cargarPedidos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vista_resumen_pedido')
      .select('*')
      .order('fecha_pedido', { ascending: false })
    if (!error) setPedidos(data)
    setLoading(false)
  }

  const filtrados =
    filtroEstado === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtroEstado)

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px' }}>Pedidos</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -20px 16px', paddingLeft: '20px', paddingRight: '20px', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFiltroEstado('todos')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: filtroEstado === 'todos' ? 'var(--accent-gold)' : 'var(--bg-card)',
            color: filtroEstado === 'todos' ? '#000' : 'var(--text-secondary)'
          }}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filtroEstado === e.value ? 'var(--accent-gold)' : 'var(--bg-card)',
              color: filtroEstado === e.value ? '#000' : 'var(--text-secondary)'
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '30vh' }}><p className="text-secondary animate-fade-in">Cargando...</p></div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((p) => (
            <Link
              key={p.pedido_id}
              to={`/pedidos/${p.pedido_id}`}
              className="card-premium animate-slide-up"
              style={{ display: 'block', textDecoration: 'none', padding: '16px' }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px' }}>
                  {p.titulo || 'Sin título'}
                </p>
                <EstadoBadge estado={p.estado} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <p className="text-secondary" style={{ fontSize: '13px' }}>Cliente: <span style={{ color: 'var(--text-primary)' }}>{p.cliente_nombre}</span></p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-secondary" style={{ fontSize: '12px' }}>{formatDate(p.fecha_pedido)}</p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{formatMoney(p.costo_total)}</p>
                  <p className="text-muted" style={{ fontSize: '12px' }}>
                    Saldo: {formatMoney(p.saldo_pendiente)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {filtrados.length === 0 && (
            <div className="flex-center" style={{ padding: '40px 0' }}>
              <p className="text-secondary">No hay pedidos con este filtro.</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <Link
        to="/pedidos/nuevo"
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + 20px)',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-gold)',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 40,
          textDecoration: 'none',
          transition: 'transform 0.2s'
        }}
        className="animate-slide-up"
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}