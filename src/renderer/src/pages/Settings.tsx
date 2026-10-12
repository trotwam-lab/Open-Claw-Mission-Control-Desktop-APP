import { useState, useEffect } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { useGatewayConnect } from '../hooks/useGateway'

const SETTINGS_KEY = 'ocmc-settings'

interface AppSettings {
  gatewayUrl: string
  gatewayToken: string
  autoConnect: boolean
  theme: 'dark' | 'light'
}

const defaultSettings: AppSettings = {
  gatewayUrl: 'ws://localhost:18789',
  gatewayToken: '',
  autoConnect: true,
  theme: 'dark',
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const { gatewayToken: _discardedToken, ...safeSettings } = parsed
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeSettings))
      return { ...defaultSettings, ...safeSettings, gatewayToken: '' }
    }
  } catch { /* */ }
  return defaultSettings
}

function saveSettings(settings: AppSettings) {
  const { gatewayToken: _sessionOnlyToken, ...persisted } = settings
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(persisted))
}

export function Settings() {
  const { status, connect, disconnect } = useGatewayConnect()
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)
  const [appVersion, setAppVersion] = useState('0.2.0')
  const [platform, setPlatform] = useState('')

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.app.getVersion().then(setAppVersion)
      window.electronAPI.app.getPlatform().then(setPlatform)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (settings.autoConnect && status === 'disconnected') {
      connect(settings.gatewayUrl, settings.gatewayToken || undefined)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleConnect = async () => {
    if (status === 'connected') {
      disconnect()
    } else {
      await connect(settings.gatewayUrl, settings.gatewayToken || undefined)
    }
  }

  const update = (patch: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure gateway connection and app preferences"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
      }}>
        {/* Gateway Connection */}
        <Card title="Gateway Connection">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Gateway URL
              </label>
              <input
                value={settings.gatewayUrl}
                onChange={e => update({ gatewayUrl: e.target.value })}
                placeholder="ws://localhost:18789"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Gateway Token (optional)
              </label>
              <input
                type="password"
                value={settings.gatewayToken}
                onChange={e => update({ gatewayToken: e.target.value })}
                placeholder="OPENCLAW_GATEWAY_TOKEN"
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Session only. The token is never saved to browser storage.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={e => update({ autoConnect: e.target.checked })}
                id="autoconnect"
                style={{ width: 'auto' }}
              />
              <label htmlFor="autoconnect" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Auto-connect on startup
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={handleConnect}>
                {status === 'connected' ? 'Disconnect' : status === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
              <StatusBadge status={status} size="md" />
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card title="Application">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow label="Version" value={`v${appVersion}`} />
            <InfoRow label="Platform" value={platform || (window.electronAPI ? 'Electron' : 'Browser')} />
            <InfoRow label="Runtime" value={window.electronAPI ? 'Desktop' : 'Web'} />
            <InfoRow label="Data" value="Settings local; secrets use Gateway vault" />

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Security</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ Vault entries require the OpenClaw Gateway vault
                </li>
                <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ Gateway tokens remain session-only
                </li>
                <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ Context isolation enabled
                </li>
                <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ WebSocket token authentication
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={handleSave}>
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
