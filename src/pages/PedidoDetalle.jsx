import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney, formatDate, ESTADOS } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import Modal from '../components/Modal'

const movVacio = { tipo: 'egreso', categoria_id: '', concepto: '', monto: '', fecha: '' }

export default function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [resumen, setResumen] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [items, setItems] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(movVacio)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    cargarTodo()
  }, [id])

  async function cargarTodo() {
    setLoading(true)
    const [r, it, mv, cat] = await Promise.all([
      supabase.from('vista_resumen_pedido').select('*').eq('pedido_id', id).single(),
      supabase.from('vista_items_pedido').select('*').eq('pedido_id', id),
      supabase
        .from('movimientos')
        .select('*, categorias_movimiento(nombre)')
        .eq('pedido_id', id)
        .order('fecha', { ascending: false }),
      supabase.from('categorias_movimiento').select('*').eq('activo', true),
    ])
    setResumen(r.data)
    setItems(it.data || [])
    setMovimientos(mv.data || [])
    setCategorias(cat.data || [])

    if (r.data) {
      const { data: c } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', r.data.cliente_id)
        .single()
      setCliente(c)
    }
    setLoading(false)
  }

  async function cambiarEstado(nuevoEstado) {
    const patch = { estado: nuevoEstado }
    if (nuevoEstado === 'entregado') patch.fecha_entregado = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('pedidos').update(patch).eq('id', id)
    if (error) alert('Error: ' + error.message)
    else cargarTodo()
  }

  async function guardarMovimiento(e) {
    e.preventDefault()
    setGuardando(true)
    const { error } = await supabase.from('movimientos').insert([
      {
        pedido_id: id,
        tipo: form.tipo,
        categoria_id: form.categoria_id || null,
        concepto: form.concepto,
        monto: Number(form.monto),
        fecha: form.fecha || new Date().toISOString().slice(0, 10),
      },
    ])
    setGuardando(false)
    if (error) {
      alert('Error al guardar movimiento: ' + error.message)
      return
    }
    setForm(movVacio)
    setModalOpen(false)
    cargarTodo()
  }

  async function eliminarPedido() {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer y eliminará todos sus movimientos asociados.')) {
      return
    }
    
    setEliminando(true)
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    
    if (error) {
      alert('Error al eliminar el pedido: ' + error.message)
      setEliminando(false)
    } else {
      navigate('/pedidos')
    }
  }

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary animate-fade-in">Cargando pedido...</p></div>
  if (!resumen) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-danger">Pedido no encontrado.</p></div>

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{resumen.cliente_nombre}</h1>
          <p className="text-secondary" style={{ fontSize: '14px' }}>Pedido del {formatDate(resumen.fecha_pedido)}</p>
        </div>
        <EstadoBadge estado={resumen.estado} />
      </div>

      {cliente && (
        <div className="card-premium animate-slide-up" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p className="label-premium" style={{ fontSize: '11px' }}>Teléfono</p>
            <p style={{ fontSize: '14px' }}>{cliente.telefono || '—'}</p>
          </div>
          <div>
            <p className="label-premium" style={{ fontSize: '11px' }}>Dirección</p>
            <p style={{ fontSize: '14px' }}>{cliente.direccion || '—'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => cambiarEstado(e.value)}
            disabled={resumen.estado === e.value}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
              border: `1px solid ${resumen.estado === e.value ? 'var(--accent-gold)' : 'var(--border-color)'}`,
              cursor: resumen.estado === e.value ? 'default' : 'pointer',
              transition: 'all 0.2s',
              background: resumen.estado === e.value ? 'var(--accent-gold)' : 'var(--bg-card)',
              color: resumen.estado === e.value ? '#000' : 'var(--text-secondary)'
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="card-premium animate-slide-up" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <p className="label-premium">Total</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatMoney(resumen.costo_total)}</p>
        </div>
        <div>
          <p className="label-premium">Pagado</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{formatMoney(resumen.total_pagado)}</p>
        </div>
        <div>
          <p className="label-premium">Saldo</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{formatMoney(resumen.saldo_pendiente)}</p>
        </div>
        <div>
          <p className="label-premium">Ganancia</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{formatMoney(resumen.ganancia_pedido)}</p>
        </div>
      </div>

      <div>
        <h2 className="label-premium" style={{ marginBottom: '12px' }}>Prendas</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((it) => (
            <div key={it.id} className="card-premium" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>{it.prenda}</p>
                <p style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>{formatMoney(it.subtotal)}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <p>Talla: <span style={{ color: 'var(--text-primary)' }}>{it.talla || '—'}</span></p>
                <p>Color: <span style={{ color: 'var(--text-primary)' }}>{it.color || '—'}</span></p>
                <p>Cant: <span style={{ color: 'var(--text-primary)' }}>{it.cantidad}</span></p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <p>Tipo: <span style={{ color: 'var(--text-primary)' }}>{it.tipo_prenda || '—'}</span></p>
                <p>Tela: <span style={{ color: 'var(--text-primary)' }}>{it.calidad_tela || '—'}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 className="label-premium" style={{ margin: 0 }}>Movimientos</h2>
          <button
            onClick={() => setModalOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Agregar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {movimientos.map((m) => (
            <div key={m.id} className="card-premium" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>{m.concepto || (m.tipo === 'ingreso' ? 'Pago' : 'Gasto')}</p>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>{formatDate(m.fecha)}</span>
                  <span>•</span>
                  <span>{m.categorias_movimiento?.nombre || 'General'}</span>
                </div>
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '16px', color: m.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                {m.tipo === 'ingreso' ? '+' : '-'} {formatMoney(m.monto)}
              </p>
            </div>
          ))}
          {movimientos.length === 0 && (
            <div className="flex-center" style={{ padding: '20px 0' }}>
              <p className="text-secondary">Aún no hay movimientos registrados.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={eliminarPedido}
          disabled={eliminando}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--danger)', 
            fontSize: '14px', 
            fontWeight: '600', 
            cursor: eliminando ? 'not-allowed' : 'pointer',
            padding: '12px',
            opacity: eliminando ? 0.5 : 1
          }}
        >
          {eliminando ? 'Eliminando...' : 'Eliminar Pedido'}
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar movimiento">
        <form onSubmit={guardarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ingreso', 'egreso'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm({ ...form, tipo: t })}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: `1px solid ${form.tipo === t ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  background: form.tipo === t ? 'var(--accent-gold-light)' : 'transparent',
                  color: form.tipo === t ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t === 'ingreso' ? 'Ingreso (pago)' : 'Egreso (gasto)'}
              </button>
            ))}
          </div>
          <div>
            <label className="label-premium">Categoría</label>
            <select
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="input-premium"
            >
              <option value="">Selecciona...</option>
              {categorias
                .filter((c) => c.tipo === form.tipo)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="label-premium">Concepto</label>
            <input
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              placeholder="Ej: Adelanto de pago"
              className="input-premium"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-premium">Monto (S/)</label>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="input-premium"
              />
            </div>
            <div>
              <label className="label-premium">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="input-premium"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="btn-primary"
            style={{ marginTop: '8px' }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}