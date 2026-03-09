import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayStatus, gateway } from '../hooks/useGateway'

interface Channel {
  id: string
  type: string // telegram, discord, slack, whatsapp, signal, etc.
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'pairing'
  agent?: string
  messageCount?: number
}

const channelIcons: Record<string, string> = {
  telegram: '✈',
  discord: '🎮',
  slack: '#',
  whatsapp: '📱',
  signal: '🔒',
  webchat: '🌐',
  irc: '💻',
}

export function Channels() {
  const gwStatus = useGatewayStatus()
  const [channels, setChannels] = useState<Channel[]>([])

  const fetchChannels = useCallback(async () => {
    if (gwStatus !== 'connected') return
    try {
      const result = await gateway.rpc('channels.list')
      if (Array.isArray(result)) setChannels(result)
    } catch { /* */ }
  }, [gwStatus])

  useEffect(() => {
    fetchChannels()
    const interval = setInterval(fetchChannels, 10000)
    return () => clearInterval(interval)
  }, [fetchChannels])

  const toggleChannel = async (id: string, action: 'enable' | 'disable') => {
    try {
      await gateway.rpc(`channels.${action}`, { id })
      fetchChannels()
    } catch { /* */ }
  }

  const connected = channels.filter(c => c.status === 'connected')
  const other = channels.filter(c => c.status !== 'connected')

  return (
    <div>
      <PageHeader
        title="Channels"
        subtitle="Manage agent connections to messaging platforms"
        actions={<button onClick={fetchChannels}>Refresh</button>}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
      }}>
        <Card title={`Connected (${connected.length})`} subtitle="Active messaging channels">
          {connected.length === 0 ? (
            <EmptyState text={gwStatus === 'connected' ? 'No connected channels' : 'Connect to Gateway'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {connected.map(ch => (
                <ChannelRow key={ch.id} channel={ch} onAction={toggleChannel} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Other Channels" subtitle="Disconnected or pairing">
          {other.length === 0 ? (
            <EmptyState text="All channels connected" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {other.map(ch => (
                <ChannelRow key={ch.id} channel={ch} onAction={toggleChannel} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function ChannelRow({ channel, onAction }: { channel: Channel; onAction: (id: string, action: 'enable' | 'disable') => void }) {
  const icon = channelIcons[channel.type] || '📡'
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0.75rem',
      background: 'rgba(11, 20, 37, 0.9)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{channel.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {channel.type} {channel.agent && `· ${channel.agent}`}
            {channel.messageCount != null && ` · ${channel.messageCount} msgs`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <StatusBadge status={channel.status} />
        {channel.status === 'connected' ? (
          <button className="secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            onClick={() => onAction(channel.id, 'disable')}>Disconnect</button>
        ) : (
          <button style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            onClick={() => onAction(channel.id, 'enable')}>Connect</button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{text}</div>
}
