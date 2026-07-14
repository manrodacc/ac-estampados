import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal'

const vacio = { id: null, nombre: '', telefono: '', direccion: '', notas: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(vacio)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setClientes(data)
    setLoading(false)
  }

  async function guardarCliente(e) {
    e.preventDefault()
    setGuardando(true)
    
    let error
    if (form.id) {
      // Editar
      const { id, created_at, ...updateData } = form // quitar id y created_at por si acaso
      const res = await supabase.from('clientes').update(updateData).eq('id', id)
      error = res.error
    } else {
      // Crear nuevo
      const { id, ...insertData } = form
      const res = await supabase.from('clientes').insert([insertData])
      error = res.error
    }

    setGuardando(false)
    
    if (error) {
      alert('Error al guardar: ' + error.message)
      return
    }
    
    setForm(vacio)
    setModalOpen(false)
    cargarClientes()
  }

  function abrirNuevoCliente() {
    setForm(vacio)
    setModalOpen(true)
  }

  function abrirEditarCliente(cliente) {
    setForm(cliente)
    setModalOpen(true)
  }

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: '24px' }}>Clientes</h1>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-premium"
          style={{ paddingLeft: '40px' }}
        />
        <svg 
          width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '30vh' }}><p className="text-secondary animate-fade-in">Cargando...</p></div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((c) => (
            <div key={c.id} className="card-premium animate-slide-up" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px' }}>{c.nombre}</p>
                  {c.telefono && <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>📞 {c.telefono}</p>}
                  {c.direccion && <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>📍 {c.direccion}</p>}
                </div>
                <button
                  onClick={() => abrirEditarCliente(c)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', padding: '8px', cursor: 'pointer' }}
                  aria-label="Editar cliente"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="flex-center" style={{ padding: '40px 0' }}>
              <p className="text-secondary">No hay clientes todavía.</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={abrirNuevoCliente}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + 20px)',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-gold)',
          color: '#000',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 40,
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        className="animate-slide-up"
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar cliente" : "Nuevo cliente"}>
        <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label-premium">Nombre</label>
            <input
              required
              value={form.nombre || ''}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input-premium"
            />
          </div>
          <div>
            <label className="label-premium">Teléfono</label>
            <input
              value={form.telefono || ''}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="input-premium"
              type="tel"
            />
          </div>
          <div>
            <label className="label-premium">Dirección</label>
            <input
              value={form.direccion || ''}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="input-premium"
            />
          </div>
          <div>
            <label className="label-premium">Notas</label>
            <textarea
              value={form.notas || ''}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="input-premium"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="btn-primary"
            style={{ marginTop: '8px' }}
          >
            {guardando ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </form>
      </Modal>
    </div>
  )
}