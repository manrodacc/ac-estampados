import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TABLAS = [
  { tabla: 'prendas', titulo: 'Prendas', extra: null },
  { tabla: 'tallas', titulo: 'Tallas', extra: 'orden' },
  { tabla: 'colores', titulo: 'Colores', extra: null },
  { tabla: 'tipos_prenda', titulo: 'Tipos de prenda / corte', extra: null },
  { tabla: 'calidades_tela', titulo: 'Calidad de tela', extra: null },
]

function CatalogoCard({ tabla, titulo, extra }) {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [orden, setOrden] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const query = supabase.from(tabla).select('*')
    const { data } = extra ? await query.order(extra) : await query.order('nombre')
    setItems(data || [])
    setLoading(false)
  }

  async function agregar(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    const payload = extra ? { nombre, [extra]: Number(orden) } : { nombre }
    const { error } = await supabase.from(tabla).insert([payload])
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    setNombre('')
    setOrden(0)
    cargar()
  }

  async function alternarActivo(item) {
    await supabase.from(tabla).update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  return (
    <div className="card-premium animate-slide-up" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>{titulo}</h3>

      {loading ? (
        <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '16px' }}>Cargando...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
          {items.map((it, idx) => (
            <li key={it.id} className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: idx !== items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <span style={{ 
                fontSize: '15px', 
                color: it.activo ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: it.activo ? 'none' : 'line-through',
                transition: 'color 0.2s'
              }}>
                {it.nombre}
              </span>
              <button
                onClick={() => alternarActivo(it)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${it.activo ? 'var(--border-color)' : 'var(--accent-gold)'}`,
                  color: it.activo ? 'var(--text-secondary)' : 'var(--accent-gold)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {it.activo ? 'Desactivar' : 'Activar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregar} style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nuevo..."
          className="input-premium"
          style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
        />
        {extra && (
          <input
            type="number"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            placeholder="#"
            className="input-premium"
            style={{ width: '60px', padding: '8px', fontSize: '14px', textAlign: 'center' }}
          />
        )}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
        >
          Añadir
        </button>
      </form>
    </div>
  )
}

export default function Catalogos() {
  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Catálogos</h1>
        <p className="text-secondary" style={{ fontSize: '14px' }}>
          Gestiona las opciones disponibles para los pedidos.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {TABLAS.map((t) => (
          <CatalogoCard key={t.tabla} {...t} />
        ))}
      </div>
    </div>
  )
}