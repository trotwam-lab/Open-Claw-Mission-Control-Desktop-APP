import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useGatewayStatus } from '../../hooks/useGateway'

interface Props { children: ReactNode }

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/sessions', label: 'Sessions', icon: '◉' },
  { path: '/chat', label: 'Chat', icon: '💬' },
  { path: '/approvals', label: 'Approvals', icon: '✓' },
  { path: '/terminal', label: 'Terminal', icon: '▸' },
  { path: '/channels', label: 'Channels', icon: '⇄' },
  { path: '/cron', label: 'Cron Jobs', icon: '⏱' },
  { path: '/vault', label: 'Vault', icon: '🔒' },
  { path: '/audit', label: 'Audit', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

const statusColors: Record<string, string> = {
  connected: 'var(--good)',
  connecting: 'var(--warn)',
  disconnected: 'var(--text-muted)',
  error: 'var(--bad)',
}

export function Layout({ children }: Props) {
  const gwStatus = useGatewayStatus()

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220,
        minWidth: 220,
        background: 'linear-gradient(180deg, #0d1529, #080e1c)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem 0',
        gap: '2px',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '0.5rem 1rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '0.5rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            OpenClaw
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Mission Control
          </div>
        </div>

        {/* Nav links */}
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.5rem 1rem',
              margin: '0 0.5rem',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.12s',
            })}
          >
            <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Gateway status */}
        <div style={{ marginTop: 'auto', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColors[gwStatus] || 'var(--text-muted)',
              boxShadow: gwStatus === 'connected' ? '0 0 6px var(--good)' : 'none',
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Gateway: {gwStatus}
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'radial-gradient(ellipse at 30% 0%, rgba(26, 46, 88, 0.25) 0%, transparent 50%), var(--bg)',
      }}>
        {children}
      </main>
    </div>
  )
}
