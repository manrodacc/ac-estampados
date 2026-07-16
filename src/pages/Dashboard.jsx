import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/format'
import Modal from '../components/Modal'

const movVacio = { tipo: 'egreso', concepto: '', monto: '', fecha: '', categoria_id: '' }

function StatCard({ label, value, accent, isMain, subtitle }) {
  return (
    <div className="card-premium animate-slide-up" style={{ padding: isMain ? '24px' : '16px', background: accent ? `linear-gradient(135deg, var(--bg-card) 0%, rgba(212,175,55,0.05) 100%)` : 'var(--bg-card)' }}>
      <p className="label-premium" style={{ marginBottom: '8px', color: accent ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{label}</p>
      <p style={{ fontSize: isMain ? '32px' : '24px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  )
}

function ProgressBar({ value, total, color, label }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{value} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>({percentage}%)</span></span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [caja, setCaja] = useState(null)
  const [pedidosSemana, setPedidosSemana] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Movimientos
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(movVacio)
  const [categorias, setCategorias] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [errorMov, setErrorMov] = useState('')

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    setLoading(true)
    
    // Calcular inicio de semana (lunes)
    const hoy = new Date()
    const dia = hoy.getDay() // 0 es domingo
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1)
    const inicioSemana = new Date(hoy.setDate(diff))
    inicioSemana.setHours(0,0,0,0)

    const [resCaja, resCats, resSemana] = await Promise.all([
      supabase.from('vista_caja_general').select('*').single(),
      supabase.from('categorias_movimiento').select('*').order('nombre'),
      supabase.from('pedidos').select('estado, costo_total, fecha_pedido').gte('fecha_pedido', inicioSemana.toISOString())
    ])

    if (resCaja.error) setError(resCaja.error.message)
    else setCaja(resCaja.data)

    if (resCats.data) setCategorias(resCats.data)
    if (resSemana.data) setPedidosSemana(resSemana.data)
      
    setLoading(false)
  }

  async function guardarMovimiento(e) {
    e.preventDefault()
    setErrorMov('')
    setGuardando(true)
    
    if (form.tipo === 'egreso' && caja && Number(form.monto) > caja.caja_actual) {
      setErrorMov('Error: Fondos insuficientes. El monto supera el saldo en caja.');
      setGuardando(false);
      return;
    }
    
    const { error } = await supabase.from('movimientos').insert([
      {
        pedido_id: null,
        tipo: form.tipo,
        categoria_id: form.categoria_id || null,
        concepto: form.concepto,
        monto: Number(form.monto),
        fecha: form.fecha || new Date().toISOString().slice(0, 10),
      },
    ])
    
    setGuardando(false)
    if (error) {
      setErrorMov('Error al guardar movimiento: ' + error.message)
      return
    }
    
    setForm(movVacio)
    setModalOpen(false)
    cargarTodo()
  }

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary animate-fade-in">Cargando dashboard...</p></div>
  if (error) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-danger">Error: {error}</p></div>

  const totalSemana = pedidosSemana.length
  const completadosSemana = pedidosSemana.filter(p => p.estado === 'entregado').length
  const ingresosProyectadosSemana = pedidosSemana.reduce((acc, p) => acc + Number(p.costo_total || 0), 0)

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="label-premium" style={{ margin: 0 }}>Rendimiento de la Semana</h3>
        </div>
        <div className="card-premium animate-slide-up" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Proyección de Ventas</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{formatMoney(ingresosProyectadosSemana)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pedidos Nuevos</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalSemana}</p>
            </div>
          </div>
          
          <div>
            <p className="label-premium" style={{ marginBottom: '12px' }}>Estado de pedidos semanales</p>
            <ProgressBar label="Entregados" value={completadosSemana} total={totalSemana} color="var(--success)" />
            <ProgressBar label="En Proceso / Listos" value={pedidosSemana.filter(p => ['en_proceso', 'listo'].includes(p.estado)).length} total={totalSemana} color="var(--info)" />
            <ProgressBar label="Pendientes" value={pedidosSemana.filter(p => p.estado === 'pendiente').length} total={totalSemana} color="var(--text-secondary)" />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="label-premium" style={{ margin: 0 }}>Movimientos Globales</h3>
          <button
            onClick={() => { setForm(movVacio); setModalOpen(true); }}
            style={{ background: 'var(--accent-gold-light)', border: 'none', color: 'var(--accent-gold)', fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Registrar Movimiento
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ingresos" value={formatMoney(caja.total_ingresos)} />
          <StatCard label="Egresos" value={formatMoney(caja.total_egresos)} />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Movimiento en Caja">
        <form onSubmit={guardarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMov && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--danger)' }}>⚠️</span>
              <p style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{errorMov}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ingreso', 'egreso'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, tipo: t, categoria_id: '' })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: form.tipo === t ? `1px solid ${t === 'ingreso' ? 'var(--success)' : 'var(--danger)'}` : '1px solid var(--border-color)',
                  backgroundColor: form.tipo === t ? (t === 'ingreso' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'var(--bg-card)',
                  color: form.tipo === t ? (t === 'ingreso' ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label-premium">Concepto *</label>
              <input required type="text" className="input-premium" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Pago de luz, Anticipo..." />
            </div>
            <div>
              <label className="label-premium">Monto (S/) *</label>
              <input required type="number" step="0.01" min="0" className="input-premium" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label-premium">Fecha</label>
            <input type="date" className="input-premium" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Dejar vacío para usar hoy</p>
          </div>

          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </form>
      </Modal>

    </div>
  )
}