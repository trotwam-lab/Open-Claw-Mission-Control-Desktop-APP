import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayStatus, gateway } from '../hooks/useGateway'

interface Session {
  id: string
  agent: string
  status: string
  model?: string
  startedAt?: string
  messageCount?: number
  tokenCount?: number
  tags?: string[]
}

export function Sessions() {
  const gwStatus = useGatewayStatus()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const fetchSessions = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const result = await gateway.rpc('sessions.list') as Session[]
      if (Array.isArray(result)) setSessions(result)
    } catch { /* */ }
  }, [gwStatus])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const filtered = sessions.filter(s => {
    if (filter === 'active') return s.status === 'active' || s.status === 'running'
    if (filter === 'completed') return s.status === 'completed' || s.status === 'ended'
    return true
  })

  const handleAction = async (sessionId: string, action: string) => {
    try {
      await gateway.rpc(`sessions.${action}`, { sessionId })
      fetchSessions()
    } catch { /* */ }
  }

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="Track agent sessions from start to finish"
        actions={<button onClick={fetchSessions}>Refresh</button>}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', padding: '0 1.5rem', marginBottom: '1rem' }}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            className={filter === f ? undefined : 'ghost'}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
      }}>
        {/* Session list */}
        <Card title={`Sessions (${filtered.length})`}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {gwStatus === 'connected' ? 'No sessions found' : 'Connect to Gateway to see sessions'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filtered.map(session => (
                <div
                  key={session.id}
                  onClick={() => setSelected(session)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: selected?.id === session.id ? 'var(--accent-dim)' : 'rgba(11, 20, 37, 0.9)',
                    border: `1px solid ${selected?.id === session.id ? 'rgba(76,196,255,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{session.agent}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>#{session.id.slice(0, 8)}</span>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: '1rem' }}>
                    {session.model && <span>{session.model}</span>}
                    {session.messageCount != null && <span>{session.messageCount} msgs</span>}
                    {session.tokenCount != null && <span>{session.tokenCount.toLocaleString()} tokens</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Session detail */}
        {selected && (
          <Card title={`Session: ${selected.agent}`} subtitle={`#${selected.id}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Detail label="Status" value={<StatusBadge status={selected.status} />} />
                <Detail label="Model" value={selected.model || 'N/A'} />
                <Detail label="Started" value={selected.startedAt || 'N/A'} />
                <Detail label="Messages" value={String(selected.messageCount ?? 'N/A')} />
                <Detail label="Tokens" value={selected.tokenCount?.toLocaleString() ?? 'N/A'} />
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tags</div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {selected.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '0.15rem 0.5rem', fontSize: '0.7rem',
                        background: 'var(--accent-dim)', borderRadius: '999px',
                        border: '1px solid rgba(76,196,255,0.2)', color: 'var(--accent)',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button onClick={() => handleAction(selected.id, 'reset')}>Reset</button>
                <button onClick={() => handleAction(selected.id, 'compact')}>Compact</button>
                <button className="danger" onClick={() => handleAction(selected.id, 'end')}>End Session</button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{value}</div>
    </div>
  )
}
