import { estadoInfo } from '../lib/format'

export default function EstadoBadge({ estado }) {
  const info = estadoInfo(estado)
  return (
    <span 
      className="badge" 
      style={{ backgroundColor: info.bg, color: info.color, border: `1px solid ${info.color}40` }}
    >
      {info.label}
    </span>
  )
}