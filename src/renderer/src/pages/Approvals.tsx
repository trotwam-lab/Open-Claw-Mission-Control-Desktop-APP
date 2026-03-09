import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayStatus, useGatewayEvents, gateway } from '../hooks/useGateway'

interface Approval {
  id: string
  agent: string
  command: string
  reason?: string
  risk?: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  resolvedAt?: string
}

export function Approvals() {
  const gwStatus = useGatewayStatus()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const { events } = useGatewayEvents('exec.approval.requested')

  const fetchApprovals = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const result = await gateway.rpc('approvals.list')
      if (Array.isArray(result)) setApprovals(result)
    } catch { /* */ }
  }, [gwStatus])

  useEffect(() => {
    fetchApprovals()
    const interval = setInterval(fetchApprovals, 3000)
    return () => clearInterval(interval)
  }, [fetchApprovals])

  // Listen for new approval requests
  useEffect(() => {
    if (events.length === 0) return
    fetchApprovals()
  }, [events, fetchApprovals])

  const resolve = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await gateway.rpc('exec.approval.resolve', { id, decision })
      setApprovals(prev => prev.map(a =>
        a.id === id ? { ...a, status: decision === 'approve' ? 'approved' : 'rejected', resolvedAt: new Date().toISOString() } : a
      ))
    } catch { /* */ }
  }

  const pending = approvals.filter(a => a.status === 'pending')
  const resolved = approvals.filter(a => a.status !== 'pending')

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="Human-in-the-loop gating for destructive actions"
        actions={
          pending.length > 0 ? (
            <span style={{
              background: 'var(--warn-dim)',
              color: 'var(--warn)',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid rgba(255,211,110,0.3)',
            }}>
              {pending.length} pending
            </span>
          ) : undefined
        }
      />

      <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Pending */}
        <Card title="Pending Approvals" subtitle="Actions waiting for your review">
          {pending.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {gwStatus === 'connected' ? 'No pending approvals' : 'Connect to Gateway'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pending.map(approval => (
                <div key={approval.id} style={{
                  padding: '0.75rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid rgba(255,211,110,0.2)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{approval.agent}</div>
                      <code style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        color: 'var(--warn)',
                        background: 'rgba(255,211,110,0.08)',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '0.35rem',
                        fontFamily: 'monospace',
                      }}>
                        {approval.command}
                      </code>
                      {approval.reason && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                          {approval.reason}
                        </div>
                      )}
                      {approval.risk && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--bad)', marginTop: '0.2rem' }}>
                          Risk: {approval.risk}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}>
                      <button className="success" onClick={() => resolve(approval.id, 'approve')}>
                        Approve
                      </button>
                      <button className="danger" onClick={() => resolve(approval.id, 'reject')}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* History */}
        {resolved.length > 0 && (
          <Card title="Resolved" subtitle="Previously handled approvals">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {resolved.slice(0, 20).map(approval => (
                <div key={approval.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{approval.agent}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>{approval.command}</span>
                  </div>
                  <StatusBadge status={approval.status} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
