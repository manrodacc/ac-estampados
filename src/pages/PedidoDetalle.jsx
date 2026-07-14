import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney, formatDate, ESTADOS } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import Modal from '../components/Modal'
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import CotizacionTemplate from '../components/CotizacionTemplate'

const movVacio = { tipo: 'egreso', categoria_id: '', concepto: '', monto: '', fecha: '' }
const itemVacio = { prenda_id: '', talla_id: '', color_id: '', tipo_prenda_id: '', calidad_tela_id: '', cantidad: 1, precio_unitario: 0 }

export default function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [resumen, setResumen] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [items, setItems] = useState([])
  const [rawItems, setRawItems] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [categorias, setCategorias] = useState([])
  
  // Catálogos para prendas
  const [prendas, setPrendas] = useState([])
  const [tallas, setTallas] = useState([])
  const [colores, setColores] = useState([])
  const [tiposPrenda, setTiposPrenda] = useState([])
  const [calidades, setCalidades] = useState([])

  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPrendasOpen, setModalPrendasOpen] = useState(false)
  const [modalCotizacionOpen, setModalCotizacionOpen] = useState(false)
  const [imagenCotizacion, setImagenCotizacion] = useState(null)
  const [generandoImagen, setGenerandoImagen] = useState(false)
  
  const cotizacionRef = useRef(null)

  const [form, setForm] = useState(movVacio)
  const [itemsEdit, setItemsEdit] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    cargarTodo()
  }, [id])

  async function cargarTodo() {
    setLoading(true)
    const [r, it, raw, mv, cat, p, t, col, tp, ct] = await Promise.all([
      supabase.from('vista_resumen_pedido').select('*').eq('pedido_id', id).single(),
      supabase.from('vista_items_pedido').select('*').eq('pedido_id', id),
      supabase.from('items_pedido').select('*').eq('pedido_id', id),
      supabase
        .from('movimientos')
        .select('*, categorias_movimiento(nombre)')
        .eq('pedido_id', id)
        .order('fecha', { ascending: false }),
      supabase.from('categorias_movimiento').select('*').eq('activo', true),
      supabase.from('prendas').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('tallas').select('id, nombre').eq('activo', true).order('orden'),
      supabase.from('colores').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('tipos_prenda').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('calidades_tela').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    
    setResumen(r.data)
    setItems(it.data || [])
    setRawItems(raw.data || [])
    setMovimientos(mv.data || [])
    setCategorias(cat.data || [])
    
    setPrendas(p.data || [])
    setTallas(t.data || [])
    setColores(col.data || [])
    setTiposPrenda(tp.data || [])
    setCalidades(ct.data || [])

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

  function abrirModalPrendas() {
    setItemsEdit(rawItems.length > 0 ? rawItems.map(ri => ({ ...ri })) : [{ ...itemVacio }])
    setModalPrendasOpen(true)
  }

  function actualizarItemEdit(index, campo, valor) {
    const nuevos = [...itemsEdit]
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    setItemsEdit(nuevos)
  }

  async function guardarPrendas(e) {
    e.preventDefault()
    setGuardando(true)

    const itemsAInsertar = itemsEdit
      .filter((it) => it.prenda_id)
      .map((it) => ({
        pedido_id: id,
        prenda_id: it.prenda_id,
        talla_id: it.talla_id || null,
        color_id: it.color_id || null,
        tipo_prenda_id: it.tipo_prenda_id || null,
        calidad_tela_id: it.calidad_tela_id || null,
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario)
      }))

    if (itemsAInsertar.length === 0) {
      alert('Debes agregar al menos una prenda al pedido')
      setGuardando(false)
      return
    }

    const nuevoCostoTotal = itemsAInsertar.reduce((acc, it) => acc + (it.cantidad * it.precio_unitario), 0)

    // Reemplazamos todos los items borrando los viejos y creando los nuevos
    await supabase.from('items_pedido').delete().eq('pedido_id', id)
    const { error: errItems } = await supabase.from('items_pedido').insert(itemsAInsertar)
    
    if (errItems) {
      alert('Error guardando prendas: ' + errItems.message)
      setGuardando(false)
      return
    }

    await supabase.from('pedidos').update({ costo_total: nuevoCostoTotal }).eq('id', id)

    setGuardando(false)
    setModalPrendasOpen(false)
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

  async function generarCotizacion() {
    if (!cotizacionRef.current) return
    setImagenCotizacion(null)
    setGenerandoImagen(true)
    setModalCotizacionOpen(true)
    try {
      const canvas = await html2canvas(cotizacionRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#0f0f13'
      })
      setImagenCotizacion(canvas.toDataURL('image/jpeg', 0.9))
    } catch (error) {
      alert('Error al generar la imagen: ' + error.message)
    } finally {
      setGenerandoImagen(false)
    }
  }

  function descargarCotizacion() {
    if (!imagenCotizacion) return
    const link = document.createElement('a')
    link.download = `Cotizacion_${cliente?.nombre.replace(/\s+/g, '_')}_${resumen?.pedido_id.slice(0,6)}.jpg`
    link.href = imagenCotizacion
    link.click()
  }

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary animate-fade-in">Cargando pedido...</p></div>
  if (!resumen) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-danger">Pedido no encontrado.</p></div>

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Cotización Oculta para html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CotizacionTemplate ref={cotizacionRef} resumen={resumen} cliente={cliente} items={items} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{resumen.titulo || 'Sin título'}</h1>
          <p className="text-secondary" style={{ fontSize: '15px' }}>
            Cliente: <span style={{ color: 'var(--text-primary)' }}>{resumen.cliente_nombre}</span>
          </p>
          <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>Pedido del {formatDate(resumen.fecha_pedido)}</p>
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

      <button
        onClick={generarCotizacion}
        className="animate-slide-up"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-gold)',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Generar Cotización
      </button>

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 className="label-premium" style={{ margin: 0 }}>Prendas</h2>
          <button
            onClick={abrirModalPrendas}
            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Editar
          </button>
        </div>
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
          {items.length === 0 && (
            <div className="flex-center" style={{ padding: '20px 0' }}>
              <p className="text-secondary">No hay prendas registradas.</p>
            </div>
          )}
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

      <Modal open={modalPrendasOpen} onClose={() => setModalPrendasOpen(false)} title="Editar Prendas">
        <form onSubmit={guardarPrendas} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
            {itemsEdit.map((it, i) => (
              <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {itemsEdit.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItemsEdit(itemsEdit.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '12px' }}>
                  <select required value={it.prenda_id || ''} onChange={(e) => actualizarItemEdit(i, 'prenda_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Prenda...</option>
                    {prendas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <select value={it.talla_id || ''} onChange={(e) => actualizarItemEdit(i, 'talla_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Talla...</option>
                    {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <select value={it.color_id || ''} onChange={(e) => actualizarItemEdit(i, 'color_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Color...</option>
                    {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <select value={it.tipo_prenda_id || ''} onChange={(e) => actualizarItemEdit(i, 'tipo_prenda_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Corte...</option>
                    {tiposPrenda.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <select value={it.calidad_tela_id || ''} onChange={(e) => actualizarItemEdit(i, 'calidad_tela_id', e.target.value)} className="input-premium" style={{ padding: '8px', gridColumn: 'span 2' }}>
                    <option value="">Calidad tela...</option>
                    {calidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-premium" style={{ fontSize: '11px' }}>Cantidad</label>
                    <input type="number" min={1} required value={it.cantidad} onChange={(e) => actualizarItemEdit(i, 'cantidad', e.target.value)} className="input-premium" style={{ padding: '8px' }} />
                  </div>
                  <div>
                    <label className="label-premium" style={{ fontSize: '11px' }}>Precio U. (S/)</label>
                    <input type="number" min={0} step="0.01" required value={it.precio_unitario} onChange={(e) => actualizarItemEdit(i, 'precio_unitario', e.target.value)} className="input-premium" style={{ padding: '8px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItemsEdit([...itemsEdit, { ...itemVacio }])}
            style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: '600' }}
          >
            + Agregar otra prenda
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              Total: S/ {itemsEdit.reduce((acc, it) => acc + (Number(it.cantidad || 0) * Number(it.precio_unitario || 0)), 0).toFixed(2)}
            </p>
          </div>

          <button type="submit" disabled={guardando} className="btn-primary" style={{ marginTop: '8px' }}>
            {guardando ? 'Guardando...' : 'Guardar Prendas'}
          </button>
        </form>
      </Modal>

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

      <Modal open={modalCotizacionOpen} onClose={() => setModalCotizacionOpen(false)} title="Generar Cotización">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          {generandoImagen ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Generando imagen de alta calidad...</p>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '20px auto' }}></div>
            </div>
          ) : imagenCotizacion ? (
            <>
              <div style={{ width: '100%', maxHeight: '50vh', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#000' }}>
                <img src={imagenCotizacion} alt="Cotización" style={{ width: '100%', display: 'block' }} />
              </div>
              <button
                onClick={descargarCotizacion}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Cotización (JPG)
              </button>
            </>
          ) : (
            <p className="text-danger">Hubo un problema al generar la cotización.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}