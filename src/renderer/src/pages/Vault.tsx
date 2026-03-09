import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { useGatewayStatus, gateway } from '../hooks/useGateway'

interface VaultEntry {
  name: string
  salt: string
  iv: string
  blob: string
}

// Crypto utilities — AES-GCM with PBKDF2 key derivation (same as original app.js)
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function b64FromBuffer(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function bufferFromB64(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0)).buffer
}

export function Vault() {
  const gwStatus = useGatewayStatus()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [form, setForm] = useState({ name: '', user: '', secret: '', passphrase: '' })
  const [revealed, setRevealed] = useState<Record<number, { name: string; user: string; secret: string }>>({})
  const [error, setError] = useState('')

  // Try gateway vault first, fall back to localStorage
  const loadEntries = useCallback(async () => {
    if (gwStatus === 'connected') {
      try {
        const result = await gateway.rpc('vault.list')
        if (Array.isArray(result)) {
          setEntries(result)
          return
        }
      } catch { /* fall through to localStorage */ }
    }
    const stored = localStorage.getItem('ocmc-vault')
    if (stored) setEntries(JSON.parse(stored))
  }, [gwStatus])

  useEffect(() => { loadEntries() }, [loadEntries])

  const storeEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const entry = { name: form.name, user: form.user, secret: form.secret }
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    try {
      const key = await deriveKey(form.passphrase, salt)
      const payload = new TextEncoder().encode(JSON.stringify(entry))
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload)

      const newEntry: VaultEntry = {
        name: entry.name,
        salt: b64FromBuffer(salt),
        iv: b64FromBuffer(iv),
        blob: b64FromBuffer(encrypted),
      }

      const updated = [...entries, newEntry]
      setEntries(updated)
      localStorage.setItem('ocmc-vault', JSON.stringify(updated))

      // Also persist to gateway if connected
      if (gwStatus === 'connected') {
        try { await gateway.rpc('vault.store', newEntry) } catch { /* local only */ }
      }

      setForm({ name: '', user: '', secret: '', passphrase: '' })
    } catch {
      setError('Encryption failed')
    }
  }

  const revealEntry = async (index: number) => {
    if (revealed[index]) {
      setRevealed(prev => { const next = { ...prev }; delete next[index]; return next })
      return
    }

    const passphrase = prompt('Enter passphrase to decrypt:')
    if (!passphrase) return

    try {
      const entry = entries[index]
      const key = await deriveKey(passphrase, new Uint8Array(bufferFromB64(entry.salt)))
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(bufferFromB64(entry.iv)) },
        key,
        bufferFromB64(entry.blob)
      )
      const data = JSON.parse(new TextDecoder().decode(decrypted))
      setRevealed(prev => ({ ...prev, [index]: data }))
    } catch {
      setError('Decryption failed — check passphrase')
    }
  }

  const deleteEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index)
    setEntries(updated)
    localStorage.setItem('ocmc-vault', JSON.stringify(updated))
    setRevealed(prev => { const next = { ...prev }; delete next[index]; return next })
  }

  return (
    <div>
      <PageHeader
        title="Secure Vault"
        subtitle="AES-GCM encrypted credential storage with PBKDF2 key derivation"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
      }}>
        {/* Store */}
        <Card title="Store Secret">
          <form onSubmit={storeEntry} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input required placeholder="Entry name (e.g. GitHub API)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Username / ID (optional)" value={form.user}
              onChange={e => setForm({ ...form, user: e.target.value })} />
            <input required placeholder="Secret / token / SSH key" value={form.secret}
              onChange={e => setForm({ ...form, secret: e.target.value })} />
            <input required type="password" placeholder="Vault passphrase" value={form.passphrase}
              onChange={e => setForm({ ...form, passphrase: e.target.value })} />
            <button type="submit">Store Secret</button>
            {error && <div style={{ color: 'var(--bad)', fontSize: '0.8rem' }}>{error}</div>}
          </form>
        </Card>

        {/* Entries */}
        <Card title={`Vault Entries (${entries.length})`}>
          {entries.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No stored secrets</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {entries.map((entry, i) => (
                <div key={i} style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(11, 20, 37, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{entry.name}</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => revealEntry(i)}>
                        {revealed[i] ? 'Hide' : 'Reveal'}
                      </button>
                      <button className="danger" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => deleteEntry(i)}>Delete</button>
                    </div>
                  </div>
                  {revealed[i] && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(76,196,255,0.05)',
                      border: '1px solid rgba(76,196,255,0.15)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                    }}>
                      {revealed[i].user && <div>User: {revealed[i].user}</div>}
                      <div style={{ wordBreak: 'break-all' }}>Secret: {revealed[i].secret}</div>
                    </div>
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
