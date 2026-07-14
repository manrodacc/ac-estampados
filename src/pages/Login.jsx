import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(false)

    async function iniciarSesion(e) {
        e.preventDefault()
        setError(null)
        setCargando(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setCargando(false)
        if (error) setError(error.message)
    }

    return (
        <div className="mobile-container flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
            <div className="card-premium animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-col items-center gap-3" style={{ marginBottom: '32px' }}>
                    <img 
                        src="/ac-estampados.jpeg" 
                        alt="AC Estampados" 
                        style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '3px solid var(--accent-gold)',
                            boxShadow: '0 0 15px var(--accent-gold-light)'
                        }}
                    />
                    <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', textAlign: 'center' }}>
                        AC Estampados
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Inicia sesión para continuar
                    </p>
                </div>

                <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="label-premium">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-premium"
                            placeholder="admin@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="label-premium">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-premium"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--danger)', borderRadius: '4px' }}>
                            <p className="text-danger" style={{ fontSize: '13px', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={cargando}
                        className="btn-primary"
                        style={{ marginTop: '8px' }}
                    >
                        {cargando ? 'Verificando...' : 'Ingresar'}
                        {!cargando && (
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}