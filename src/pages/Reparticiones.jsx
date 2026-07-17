import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney, formatDate } from '../lib/format'
import Modal from '../components/Modal'

export default function Reparticiones() {
  const [reparticiones, setReparticiones] = useState([])
  const [cajaActual, setCajaActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [montoTotal, setMontoTotal] = useState('')
  const [montoRenata, setMontoRenata] = useState('')
  const [montoRodrigo, setMontoRodrigo] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    setLoading(true)
    setError(null)
    
    // Obtener caja actual
    const { data: cajaData, error: cajaError } = await supabase.from('vista_caja_general').select('caja_actual').single()
    if (!cajaError && cajaData) {
      setCajaActual(Number(cajaData.caja_actual) || 0)
    }

    // Obtener historial de reparticiones
    const { data: repData, error: repError } = await supabase.from('reparticiones').select('*').order('created_at', { ascending: false })
    if (repError) {
      // Si la tabla no existe aún, mostramos un error amigable
      if (repError.code === '42P01') {
        setError('Falta crear la tabla de reparticiones en la base de datos (SQL).')
      } else {
        setError(repError.message)
      }
    } else {
      setReparticiones(repData || [])
    }
    
    setLoading(false)
  }

  // Lógica para auto-calcular montos (50/50 por defecto)
  function handleTotalChange(val) {
    setMontoTotal(val)
    const num = Number(val)
    if (!isNaN(num) && num > 0) {
      const mitad = (num / 2).toFixed(2)
      setMontoRenata(mitad)
      setMontoRodrigo((num - Number(mitad)).toFixed(2)) // para cuadrar centavos
    } else {
      setMontoRenata('')
      setMontoRodrigo('')
    }
  }

  async function guardarReparticion(e) {
    e.preventDefault()
    setErrorModal('')
    const total = Number(montoTotal)
    const renata = Number(montoRenata)
    const rodrigo = Number(montoRodrigo)

    if (total <= 0) return setErrorModal('El monto debe ser mayor a 0.')
    if (total > cajaActual) return setErrorModal('El monto a repartir no puede superar la caja actual.')
    if (Math.abs(total - (renata + rodrigo)) > 0.05) return setErrorModal('La suma de Renata y Rodrigo debe ser igual al total.')

    setGuardando(true)

    const fechaFinal = fecha || new Date().toISOString().slice(0, 10)

    // 1. Guardar en la tabla reparticiones
    const { error: errorRep } = await supabase.from('reparticiones').insert([{
      monto_total: total,
      monto_renata: renata,
      monto_rodrigo: rodrigo,
      notas: notas,
      fecha: fechaFinal
    }])

    if (errorRep) {
      setErrorModal('Error al registrar la repartición: ' + errorRep.message)
      setGuardando(false)
      return
    }

    // 2. Crear egresos en la caja general
    const { error: errorMovs } = await supabase.from('movimientos').insert([
      { tipo: 'egreso', concepto: 'Reparto de utilidades - Renata', monto: renata, fecha: fechaFinal },
      { tipo: 'egreso', concepto: 'Reparto de utilidades - Rodrigo', monto: rodrigo, fecha: fechaFinal }
    ])

    if (errorMovs) {
      // Nota: Si esto falla, la repartición se guardó pero la caja no se descontó. 
      // En una app más compleja usaríamos una transacción (RPC). 
      setErrorModal('Error al descontar de caja: ' + errorMovs.message)
      setGuardando(false)
      return
    }

    setModalOpen(false)
    setGuardando(false)
    setMontoTotal('')
    setMontoRenata('')
    setMontoRodrigo('')
    setFecha('')
    setNotas('')
    cargarTodo()
  }

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary animate-fade-in">Cargando reparticiones...</p></div>

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 style={{ fontSize: '24px', margin: 0 }}>Reparto de Caja</h2>
          <p className="text-secondary" style={{ fontSize: '14px', margin: 0 }}>Distribución de utilidades</p>
        </div>
      </div>

      {error ? (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Atención Requerida</p>
          <p style={{ color: 'var(--text-primary)', marginTop: '8px' }}>{error}</p>
        </div>
      ) : (
        <>
          <div className="card-premium animate-slide-up" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(212,175,55,0.05) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="label-premium" style={{ color: 'var(--accent-gold)' }}>Caja Disponible</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{formatMoney(cajaActual)}</p>
            </div>
            <button 
              onClick={() => { setMontoTotal(cajaActual); handleTotalChange(cajaActual); setModalOpen(true); }}
              className="btn-primary" 
              style={{ width: 'auto', padding: '12px 24px' }}
              disabled={cajaActual <= 0}
            >
              Nuevo Reparto
            </button>
          </div>

          <div>
            <h3 className="label-premium" style={{ marginBottom: '16px' }}>Historial de Reparticiones</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reparticiones.length === 0 ? (
                <div className="card-premium flex-center" style={{ padding: '40px 20px' }}>
                  <p className="text-secondary">No hay reparticiones registradas aún.</p>
                </div>
              ) : (
                reparticiones.map((rep) => (
                  <div key={rep.id} className="card-premium animate-fade-in" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge-gold">Reparto</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(rep.fecha)}</span>
                        </div>
                        {rep.notas && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{rep.notas}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Retirado</p>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)' }}>- {formatMoney(rep.monto_total)}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Para Renata</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatMoney(rep.monto_renata)}</p>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Para Rodrigo</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatMoney(rep.monto_rodrigo)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Nueva Reparticion */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Repartir Caja">
        <form onSubmit={guardarReparticion} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorModal && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--danger)', fontSize: '13px', margin: 0 }}>{errorModal}</p>
            </div>
          )}

          <div>
            <label className="label-premium">¿Cuánto dinero extraer de la caja?</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              min="0.1" 
              max={cajaActual}
              className="input-premium" 
              value={montoTotal} 
              onChange={(e) => handleTotalChange(e.target.value)} 
              style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-gold)' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Disponible máximo: {formatMoney(cajaActual)}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label-premium">Parte de Renata (S/)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                className="input-premium" 
                value={montoRenata} 
                onChange={(e) => setMontoRenata(e.target.value)} 
              />
            </div>
            <div>
              <label className="label-premium">Parte de Rodrigo (S/)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                className="input-premium" 
                value={montoRodrigo} 
                onChange={(e) => setMontoRodrigo(e.target.value)} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label-premium">Fecha del reparto</label>
              <input 
                type="date" 
                className="input-premium" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Si lo dejas vacío, usa la fecha de hoy</p>
            </div>
            <div>
              <label className="label-premium">Notas (Opcional)</label>
              <input 
                type="text" 
                className="input-premium" 
                value={notas} 
                onChange={(e) => setNotas(e.target.value)} 
                placeholder="Ej: Semana del 12 al 18 de Agosto" 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Procesando...' : 'Confirmar Reparto'}
          </button>
        </form>
      </Modal>

    </div>
  )
}
