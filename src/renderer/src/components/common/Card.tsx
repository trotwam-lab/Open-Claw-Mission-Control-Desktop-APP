import { ReactNode, CSSProperties } from 'react'

interface Props {
  title?: string
  subtitle?: string
  children: ReactNode
  style?: CSSProperties
  actions?: ReactNode
}

export function Card({ title, subtitle, children, style, actions }: Props) {
  return (
    <section style={{
      background: 'linear-gradient(180deg, rgba(19, 30, 53, 0.84), rgba(13, 20, 34, 0.88))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem',
      boxShadow: 'var(--shadow)',
      backdropFilter: 'blur(8px)',
      ...style,
    }}>
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: subtitle ? '0.25rem' : '0.75rem' }}>
          {title && <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h2>}
          {actions}
        </div>
      )}
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{subtitle}</p>}
      {children}
    </section>
  )
}
