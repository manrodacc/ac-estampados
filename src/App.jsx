import { Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import { supabase } from './lib/supabaseClient'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pedidos from './pages/Pedidos'
import NuevoPedido from './pages/NuevoPedido'
import PedidoDetalle from './pages/PedidoDetalle'
import Catalogos from './pages/Catalogos'
import Reparticiones from './pages/Reparticiones'

export default function App() {
  const session = useAuth()

  if (session === undefined) {
    return (
      <div className="mobile-container flex-center">
        <div className="text-secondary animate-fade-in">Cargando...</div>
      </div>
    )
  }

  if (session === null) {
    return <Login />
  }

  return (
    <div className="mobile-container">
      <header className="page-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src="/ac-estampados.jpeg" 
            alt="AC Estampados" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
          />
          <h1 style={{ fontSize: '18px', margin: 0, color: 'var(--accent-gold)' }}>AC Estampados</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <main style={{ padding: '20px' }} className="animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/nuevo" element={<NuevoPedido />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} />
          <Route path="/catalogos" element={<Catalogos />} />
          <Route path="/reparticiones" element={<Reparticiones />} />
        </Routes>
      </main>
      
      <Navbar />
    </div>
  )
}