export function formatMoney(value) {
  const n = Number(value || 0)
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', bg: 'rgba(161, 161, 170, 0.15)', color: '#A1A1AA' },
  { value: 'en_proceso', label: 'En proceso', bg: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' },
  { value: 'listo', label: 'Listo', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  { value: 'entregado', label: 'Entregado', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  { value: 'cancelado', label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
]

export function estadoInfo(value) {
  return ESTADOS.find((e) => e.value === value) || ESTADOS[0]
}