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
  precio_total: 0,
  modo_precio: 'unitario',
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
  const [tipoServicio, setTipoServicio] = useState('estampado_polo')
  const [titulo, setTitulo] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState([{ ...itemVacio }])
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
    const item = { ...nuevos[index] }
    
    if (campo === 'modo_precio') {
      item.modo_precio = valor
    } else if (campo === 'precio_unitario') {
      item.precio_unitario = valor
      if (item.cantidad > 0) item.precio_total = valor * item.cantidad
    } else if (campo === 'precio_total') {
      item.precio_total = valor
      if (item.cantidad > 0) item.precio_unitario = valor / item.cantidad
    } else if (campo === 'cantidad') {
      item.cantidad = valor
      if (item.modo_precio === 'unitario') {
         item.precio_total = item.precio_unitario * valor
      } else {
         item.precio_unitario = item.precio_total / valor
      }
    } else {
      item[campo] = valor
    }
    
    nuevos[index] = item
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
    setErrorMsg('')
    if (!clienteId) {
      setErrorMsg('Selecciona un cliente')
      return
    }
    if (!titulo) {
      setErrorMsg('Debes ingresar un título para el pedido')
      return
    }
    setGuardando(true)

    const { data: pedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: clienteId,
          titulo: `[${tipoServicio === 'estampado_polo' ? 'Estampado + Polo' : 'Solo Estampado'}] ${titulo}`,
          fecha_entrega_estimada: fechaEntrega || null,
          notas,
          costo_total: costoTotal,
          estado: 'pendiente',
        },
      ])
      .select()
      .single()

    if (errPedido) {
      setErrorMsg('Error al crear pedido: ' + errPedido.message)
      setGuardando(false)
      return
    }

    const itemsAInsertar = items
      .filter((it) => it.prenda_id)
      .map((it) => {
        const { modo_precio, precio_total, ...rest } = it
        return { 
          ...rest, 
          pedido_id: pedido.id,
          talla_id: rest.talla_id || null,
          color_id: rest.color_id || null,
          tipo_prenda_id: rest.tipo_prenda_id || null,
          calidad_tela_id: rest.calidad_tela_id || null
        }
      })

    const { error: errItems } = await supabase.from('items_pedido').insert(itemsAInsertar)

    setGuardando(false)

    if (errItems) {
      setErrorMsg('Pedido creado, pero hubo un error con las prendas: ' + errItems.message)
      return
    }

    navigate(`/pedidos/${pedido.id}`)
  }

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px' }}>Nuevo Pedido</h1>

      {errorMsg && (
        <div className="card-premium animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--danger)', fontSize: '20px' }}>⚠️</span>
          <p style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={guardarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card-premium animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label className="label-premium" style={{ marginBottom: '8px', display: 'block' }}>Tipo de servicio</label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <label className="label-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none' }}>
                <input type="radio" name="tipoServicio" value="estampado_polo" checked={tipoServicio === 'estampado_polo'} onChange={(e) => setTipoServicio(e.target.value)} />
                Estampado + Polo
              </label>
              <label className="label-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none' }}>
                <input type="radio" name="tipoServicio" value="solo_estampado" checked={tipoServicio === 'solo_estampado'} onChange={(e) => setTipoServicio(e.target.value)} />
                Solo Estampado
              </label>
            </div>
            
            <label className="label-premium">Título del pedido</label>
            <input
              required
              type="text"
              placeholder="Ej: Polos deportivos azules..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input-premium"
            />
          </div>

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="label-premium" style={{ fontSize: '11px', margin: 0 }}>Precio (S/)</label>
                      <select value={it.modo_precio || 'unitario'} onChange={(e) => actualizarItem(i, 'modo_precio', e.target.value)} style={{ fontSize: '11px', background: 'transparent', color: 'var(--accent-gold)', border: 'none', cursor: 'pointer', outline: 'none', fontWeight: 'bold' }}>
                        <option value="unitario">Unitario</option>
                        <option value="total">Total</option>
                      </select>
                    </div>
                    {it.modo_precio === 'unitario' || !it.modo_precio ? (
                      <input type="number" min={0} step="0.01" value={it.precio_unitario} onChange={(e) => actualizarItem(i, 'precio_unitario', e.target.value)} className="input-premium" style={{ padding: '8px' }} placeholder="Precio U." />
                    ) : (
                      <input type="number" min={0} step="0.01" value={it.precio_total} onChange={(e) => actualizarItem(i, 'precio_total', e.target.value)} className="input-premium" style={{ padding: '8px' }} placeholder="Precio Total" />
                    )}
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