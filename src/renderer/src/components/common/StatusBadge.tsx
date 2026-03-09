interface Props {
  status: string
  size?: 'sm' | 'md'
}

const colors: Record<string, { bg: string; text: string; border: string }> = {
  running: { bg: 'var(--good-dim)', text: 'var(--good)', border: 'rgba(66,223,159,0.3)' },
  active: { bg: 'var(--good-dim)', text: 'var(--good)', border: 'rgba(66,223,159,0.3)' },
  connected: { bg: 'var(--good-dim)', text: 'var(--good)', border: 'rgba(66,223,159,0.3)' },
  approved: { bg: 'var(--good-dim)', text: 'var(--good)', border: 'rgba(66,223,159,0.3)' },
  completed: { bg: 'var(--accent-dim)', text: 'var(--accent)', border: 'rgba(76,196,255,0.3)' },
  pending: { bg: 'var(--warn-dim)', text: 'var(--warn)', border: 'rgba(255,211,110,0.3)' },
  waiting: { bg: 'var(--warn-dim)', text: 'var(--warn)', border: 'rgba(255,211,110,0.3)' },
  paused: { bg: 'var(--warn-dim)', text: 'var(--warn)', border: 'rgba(255,211,110,0.3)' },
  stopped: { bg: 'var(--bad-dim)', text: 'var(--bad)', border: 'rgba(255,111,128,0.3)' },
  error: { bg: 'var(--bad-dim)', text: 'var(--bad)', border: 'rgba(255,111,128,0.3)' },
  rejected: { bg: 'var(--bad-dim)', text: 'var(--bad)', border: 'rgba(255,111,128,0.3)' },
  disconnected: { bg: 'rgba(93,112,153,0.15)', text: 'var(--text-muted)', border: 'var(--border)' },
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const s = status.toLowerCase()
  const c = colors[s] || colors.disconnected
  const pad = size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem'
  const fs = size === 'sm' ? '0.7rem' : '0.8rem'

  return (
    <span style={{
      display: 'inline-block',
      padding: pad,
      fontSize: fs,
      fontWeight: 600,
      borderRadius: '999px',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }}>
      {status}
    </span>
  )
}
