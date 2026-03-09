import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { useGatewayStatus, useGatewayEvents, gateway } from '../hooks/useGateway'

interface AuditEntry {
  id?: string
  timestamp: string
  event: string
  agent?: string
  category?: string
  details?: string
}

export function Audit() {
  const gwStatus = useGatewayStatus()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [filter, setFilter] = useState('')
  const { events } = useGatewayEvents()

  const fetchAudit = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const result = await gateway.rpc('audit.list', { limit: 100 })
      if (Array.isArray(result)) setEntries(result)
    } catch { /* */ }
  }, [gwStatus])

  useEffect(() => {
    fetchAudit()
  }, [fetchAudit])

  // Append live gateway events as audit entries
  useEffect(() => {
    if (events.length === 0) return
    const latest = events[0]
    const entry: AuditEntry = {
      timestamp: new Date().toLocaleTimeString(),
      event: latest.event || 'unknown',
      details: typeof latest.data === 'object' ? JSON.stringify(latest.data) : String(latest.data || ''),
    }
    setEntries(prev => [entry, ...prev].slice(0, 200))
  }, [events])

  const filtered = entries.filter(e => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return e.event.toLowerCase().includes(q) ||
      (e.agent || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.details || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Complete action history — approvals, controls, gateway events"
        actions={<button onClick={fetchAudit}>Refresh</button>}
      />

      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <Card>
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              placeholder="Filter events..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: '100%', maxWidth: 400 }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {gwStatus === 'connected' ? 'No audit events' : 'Connect to Gateway to see events'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              {filtered.map((entry, i) => (
                <div key={entry.id || i} style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  padding: '0.45rem 0.65rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem', flexShrink: 0 }}>
                    {entry.timestamp}
                  </span>
                  {entry.agent && (
                    <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{entry.agent}</span>
                  )}
                  {entry.category && (
                    <span style={{
                      padding: '0.1rem 0.4rem', fontSize: '0.65rem', borderRadius: '999px',
                      background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(76,196,255,0.2)',
                      flexShrink: 0,
                    }}>{entry.category}</span>
                  )}
                  <span style={{ flex: 1 }}>{entry.event}</span>
                  {entry.details && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.details}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
