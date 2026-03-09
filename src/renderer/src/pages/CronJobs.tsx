import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayStatus, gateway } from '../hooks/useGateway'

interface CronJob {
  id: string
  name: string
  schedule: string
  agent: string
  status: 'active' | 'paused' | 'error'
  lastRun?: string
  nextRun?: string
}

export function CronJobs() {
  const gwStatus = useGatewayStatus()
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', schedule: '', agent: '', task: '' })

  const fetchJobs = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const result = await gateway.rpc('cron.list')
      if (Array.isArray(result)) setJobs(result)
    } catch { /* */ }
  }, [gwStatus])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 15000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const toggleJob = async (id: string, action: 'pause' | 'resume' | 'delete') => {
    try {
      await gateway.rpc(`cron.${action}`, { id })
      fetchJobs()
    } catch { /* */ }
  }

  const createJob = async () => {
    if (!newJob.name || !newJob.schedule) return
    try {
      await gateway.rpc('cron.create', newJob)
      setShowCreate(false)
      setNewJob({ name: '', schedule: '', agent: '', task: '' })
      fetchJobs()
    } catch { /* */ }
  }

  return (
    <div>
      <PageHeader
        title="Cron Jobs"
        subtitle="Schedule recurring tasks for your agents"
        actions={
          <button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ New Job'}
          </button>
        }
      />

      <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Create form */}
        {showCreate && (
          <Card title="New Cron Job">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input placeholder="Job name" value={newJob.name} onChange={e => setNewJob({ ...newJob, name: e.target.value })} />
              <input placeholder="Schedule (e.g. 0 9 * * *)" value={newJob.schedule} onChange={e => setNewJob({ ...newJob, schedule: e.target.value })} />
              <input placeholder="Agent" value={newJob.agent} onChange={e => setNewJob({ ...newJob, agent: e.target.value })} />
              <input placeholder="Task description" value={newJob.task} onChange={e => setNewJob({ ...newJob, task: e.target.value })} />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="success" onClick={createJob}>Create</button>
            </div>
          </Card>
        )}

        {/* Job list */}
        <Card title={`Scheduled Jobs (${jobs.length})`}>
          {jobs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {gwStatus === 'connected' ? 'No cron jobs configured' : 'Connect to Gateway'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {jobs.map(job => (
                <div key={job.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{job.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      <code style={{ color: 'var(--accent)' }}>{job.schedule}</code>
                      <span style={{ marginLeft: 8 }}>Agent: {job.agent}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {job.lastRun && `Last: ${job.lastRun}`}
                      {job.nextRun && ` · Next: ${job.nextRun}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <StatusBadge status={job.status} />
                    {job.status === 'active' ? (
                      <button className="secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => toggleJob(job.id, 'pause')}>Pause</button>
                    ) : (
                      <button style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => toggleJob(job.id, 'resume')}>Resume</button>
                    )}
                    <button className="danger" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => toggleJob(job.id, 'delete')}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
