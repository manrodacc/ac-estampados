import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const itemVacio = {
  prenda_id: '',
  talla_id: '',
  color_id: '',
  tipo_prenda_id: '',
  calidad_tela_id: '',
  cantidad: 1,
  precio_unitario: 0,
}

export default function NuevoPedido() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [prendas, setPrendas] = useState([])
  const [tallas, setTallas] = useState([])
  const [colores, setColores] = useState([])
  const [tiposPrenda, setTiposPrenda] = useState([])
  const [calidades, setCalidades] = useState([])

  const [clienteId, setClienteId] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState([{ ...itemVacio }])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarCatalogos()
  }, [])

  async function cargarCatalogos() {
    const [c, p, t, col, tp, ct] = await Promise.all([
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('prendas').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('tallas').select('id, nombre').eq('activo', true).order('orden'),
      supabase.from('colores').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('tipos_prenda').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('calidades_tela').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    setClientes(c.data || [])
    setPrendas(p.data || [])
    setTallas(t.data || [])
    setColores(col.data || [])
    setTiposPrenda(tp.data || [])
    setCalidades(ct.data || [])
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    setItems(nuevos)
  }

  function agregarItem() {
    setItems([...items, { ...itemVacio }])
  }

  function quitarItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  const costoTotal = items.reduce(
    (acc, it) => acc + Number(it.cantidad || 0) * Number(it.precio_unitario || 0),
    0
  )

  async function guardarPedido(e) {
    e.preventDefault()
    if (!clienteId) {
      alert('Selecciona un cliente')
      return
    }
    setGuardando(true)

    const { data: pedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: clienteId,
          fecha_entrega_estimada: fechaEntrega || null,
          notas,
          costo_total: costoTotal,
          estado: 'pendiente',
        },
      ])
      .select()
      .single()

    if (errPedido) {
      alert('Error al crear pedido: ' + errPedido.message)
      setGuardando(false)
      return
    }

    const itemsAInsertar = items
      .filter((it) => it.prenda_id)
      .map((it) => ({ ...it, pedido_id: pedido.id }))

    const { error: errItems } = await supabase.from('items_pedido').insert(itemsAInsertar)

    setGuardando(false)

    if (errItems) {
      alert('Pedido creado, pero hubo un error con los items: ' + errItems.message)
    }

    navigate(`/pedidos/${pedido.id}`)
  }

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px' }}>Nuevo Pedido</h1>

      <form onSubmit={guardarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card-premium animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label-premium">Cliente</label>
            <select
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="input-premium"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="text-secondary" style={{ fontSize: '12px', marginTop: '6px' }}>
              ¿No está en la lista? Créalo primero en la sección Clientes.
            </p>
          </div>

          <div>
            <label className="label-premium">Fecha de entrega estimada</label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="input-premium"
            />
          </div>

          <div>
            <label className="label-premium">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="input-premium"
              rows={2}
            />
          </div>
        </div>

        <div className="card-premium animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex items-center justify-between">
            <h2 className="label-premium" style={{ marginBottom: 0 }}>Prendas del pedido</h2>
            <button
              type="button"
              onClick={agregarItem}
              style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((it, i) => (
              <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarItem(i)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    aria-label="Quitar prenda"
                  >
                    ×
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '12px' }}>
                  <select value={it.prenda_id} onChange={(e) => actualizarItem(i, 'prenda_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Prenda...</option>
                    {prendas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <select value={it.talla_id} onChange={(e) => actualizarItem(i, 'talla_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Talla...</option>
                    {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <select value={it.color_id} onChange={(e) => actualizarItem(i, 'color_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Color...</option>
                    {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <select value={it.tipo_prenda_id} onChange={(e) => actualizarItem(i, 'tipo_prenda_id', e.target.value)} className="input-premium" style={{ padding: '8px' }}>
                    <option value="">Corte...</option>
                    {tiposPrenda.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <select value={it.calidad_tela_id} onChange={(e) => actualizarItem(i, 'calidad_tela_id', e.target.value)} className="input-premium" style={{ padding: '8px', gridColumn: 'span 2' }}>
                    <option value="">Calidad de tela...</option>
                    {calidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-premium" style={{ fontSize: '11px' }}>Cantidad</label>
                    <input type="number" min={1} value={it.cantidad} onChange={(e) => actualizarItem(i, 'cantidad', e.target.value)} className="input-premium" style={{ padding: '8px' }} />
                  </div>
                  <div>
                    <label className="label-premium" style={{ fontSize: '11px' }}>Precio U. (S/)</label>
                    <input type="number" min={0} step="0.01" value={it.precio_unitario} onChange={(e) => actualizarItem(i, 'precio_unitario', e.target.value)} className="input-premium" style={{ padding: '8px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              Total: S/ {costoTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="btn-primary"
          style={{ padding: '16px', fontSize: '16px' }}
        >
          {guardando ? 'Guardando...' : 'Crear pedido'}
        </button>
      </form>
    </div>
  )
}