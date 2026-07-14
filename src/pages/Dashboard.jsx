import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/format'

function StatCard({ label, value, accent, isMain }) {
  return (
    <div className="card-premium animate-slide-up" style={{ padding: isMain ? '24px' : '16px', background: accent ? `linear-gradient(135deg, var(--bg-card) 0%, rgba(212,175,55,0.05) 100%)` : 'var(--bg-card)' }}>
      <p className="label-premium" style={{ marginBottom: '8px', color: accent ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{label}</p>
      <p style={{ fontSize: isMain ? '32px' : '24px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [caja, setCaja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarCaja()
  }, [])

  async function cargarCaja() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vista_caja_general')
      .select('*')
      .single()
    if (error) setError(error.message)
    else setCaja(data)
    setLoading(false)
  }

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary animate-fade-in">Cargando caja...</p></div>
  if (error) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-danger">Error: {error}</p></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Resumen General</h2>
        <p className="text-secondary" style={{ fontSize: '14px' }}>Estado financiero de AC Estampados</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <StatCard label="Caja actual" value={formatMoney(caja.caja_actual)} accent={true} isMain={true} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ganancia (entregados)" value={formatMoney(caja.ganancia_total_entregados)} />
          <StatCard label="Total pedidos" value={caja.total_pedidos} />
        </div>
      </div>

      <div>
        <h3 className="label-premium" style={{ marginBottom: '12px' }}>Pedidos por estado</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Pendientes" value={caja.pedidos_pendientes} />
          <StatCard label="En proceso" value={caja.pedidos_en_proceso} />
          <StatCard label="Listos" value={caja.pedidos_listos} />
          <StatCard label="Entregados" value={caja.pedidos_entregados} />
          <StatCard label="Cancelados" value={caja.pedidos_cancelados} />
        </div>
      </div>

      <div>
        <h3 className="label-premium" style={{ marginBottom: '12px' }}>Movimientos</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ingresos" value={formatMoney(caja.total_ingresos)} />
          <StatCard label="Egresos" value={formatMoney(caja.total_egresos)} />
        </div>
      </div>
    </div>
  )
}