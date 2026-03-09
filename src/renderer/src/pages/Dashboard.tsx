import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricCard } from '../components/common/MetricCard'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayStatus, gateway } from '../hooks/useGateway'

interface Agent {
  name: string
  status: string
  model?: string
  tokens?: number
  task?: string
}

interface Project {
  id: string
  name: string
  status: string
}

interface TimelineEntry {
  time: string
  event: string
}

export function Dashboard() {
  const gwStatus = useGatewayStatus()
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)

  const fetchData = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const [agentRes, statusRes] = await Promise.allSettled([
        gateway.rpc('agents.list'),
        gateway.rpc('status.get'),
      ])
      if (agentRes.status === 'fulfilled' && Array.isArray(agentRes.value)) {
        setAgents(agentRes.value)
        setTotalTokens(agentRes.value.reduce((sum: number, a: Agent) => sum + (a.tokens || 0), 0))
      }
      if (statusRes.status === 'fulfilled' && statusRes.value) {
        const s = statusRes.value as Record<string, unknown>
        if (Array.isArray(s.projects)) setProjects(s.projects)
        if (Array.isArray(s.timeline)) setTimeline(s.timeline)
        if (typeof s.pendingApprovals === 'number') setPendingApprovals(s.pendingApprovals)
      }
    } catch { /* gateway not available yet */ }
  }, [gwStatus])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'running')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your OpenClaw system"
        actions={
          <StatusBadge status={gwStatus} size="md" />
        }
      />

      {/* Metrics row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.65rem',
        padding: '0 1.5rem',
        marginBottom: '1rem',
      }}>
        <MetricCard label="Total Agents" value={agents.length} />
        <MetricCard label="Active Agents" value={activeAgents.length} color="var(--good)" />
        <MetricCard label="Pending Approvals" value={pendingApprovals} color={pendingApprovals > 0 ? 'var(--warn)' : undefined} />
        <MetricCard label="Token Throughput" value={totalTokens} color="var(--accent)" />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
      }}>
        {/* Agent Status */}
        <Card title="Agent Status" subtitle="Current agent activity">
          {agents.length === 0 && gwStatus !== 'connected' ? (
            <EmptyState message="Connect to Gateway to see agents" />
          ) : agents.length === 0 ? (
            <EmptyState message="No agents running" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {agents.map((agent, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agent.name}</div>
                    {agent.task && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{agent.task}</div>}
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Projects */}
        <Card title="Project Runtime" subtitle="Pause, resume, or stop projects">
          {projects.length === 0 ? (
            <EmptyState message={gwStatus === 'connected' ? 'No projects' : 'Connect to Gateway'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {projects.map((project) => (
                <div key={project.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{project.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>{project.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <StatusBadge status={project.status} />
                    <button className="secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => gateway.rpc('projects.pause', { id: project.id })}>Pause</button>
                    <button className="success" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => gateway.rpc('projects.resume', { id: project.id })}>Resume</button>
                    <button className="danger" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => gateway.rpc('projects.stop', { id: project.id })}>Stop</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Timeline */}
        <Card title="Mission Timeline" subtitle="Recent events">
          {timeline.length === 0 ? (
            <EmptyState message="No timeline events" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {timeline.slice(0, 10).map((entry, i) => (
                <div key={i} style={{
                  borderLeft: '3px solid var(--accent)',
                  padding: '0.45rem 0.65rem',
                  background: 'rgba(10, 18, 33, 0.85)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{entry.time}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.event}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Token Usage */}
        <Card title="Token Usage" subtitle="Per-agent model and token counts">
          {agents.length === 0 ? (
            <EmptyState message="No agent data" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {agents.map((agent, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.45rem 0.65rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agent.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{agent.model || 'unknown'}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {(agent.tokens || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
    }}>
      {message}
    </div>
  )
}
