interface Props {
  label: string
  value: string | number
  color?: string
}

export function MetricCard({ label, value, color }: Props) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(19, 30, 53, 0.84), rgba(13, 20, 34, 0.88))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1rem',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{label}</div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        marginTop: '0.15rem',
        color: color || 'var(--text)',
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}
