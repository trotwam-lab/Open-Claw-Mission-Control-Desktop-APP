import { useState, useEffect, useRef, useCallback } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { useGatewayStatus, useGatewayEvents, gateway } from '../hooks/useGateway'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  agent?: string
}

interface AgentOption {
  name: string
  id: string
}

export function Chat() {
  const gwStatus = useGatewayStatus()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { events } = useGatewayEvents('chat.message')

  // Load available agents
  useEffect(() => {
    if (gwStatus !== 'connected') return
    gateway.rpc('agents.list').then((res) => {
      if (Array.isArray(res)) {
        const opts = res.map((a: { name: string; id?: string }) => ({
          name: a.name,
          id: a.id || a.name,
        }))
        setAgents(opts)
        if (opts.length > 0 && !selectedAgent) setSelectedAgent(opts[0].id)
      }
    }).catch(() => {})
  }, [gwStatus])

  // Handle incoming chat events
  useEffect(() => {
    if (events.length === 0) return
    const latest = events[0]
    if (latest.data) {
      const d = latest.data as { role?: string; content?: string; agent?: string }
      if (d.content) {
        setMessages(prev => [...prev, {
          role: (d.role as ChatMessage['role']) || 'assistant',
          content: d.content!,
          timestamp: new Date().toLocaleTimeString(),
          agent: d.agent,
        }])
        setStreaming(false)
      }
    }
  }, [events])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || gwStatus !== 'connected') return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    try {
      const result = await gateway.rpc('chat.send', {
        agent: selectedAgent,
        message: text,
      })
      // If the response comes back synchronously (non-streaming)
      if (result && typeof result === 'object') {
        const r = result as { content?: string; message?: string }
        const content = r.content || r.message
        if (content) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content,
            timestamp: new Date().toLocaleTimeString(),
            agent: selectedAgent,
          }])
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send'}`,
        timestamp: new Date().toLocaleTimeString(),
      }])
    } finally {
      setStreaming(false)
    }
  }, [input, selectedAgent, gwStatus])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Chat"
        subtitle="Converse with your agents directly"
        actions={
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            style={{ minWidth: 160 }}
          >
            {agents.length === 0 && <option value="">No agents</option>}
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        }
      />

      <div style={{ flex: 1, padding: '0 1.5rem', overflow: 'hidden', display: 'flex' }}>
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingBottom: '0.5rem',
          }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {gwStatus === 'connected' ? 'Send a message to start chatting' : 'Connect to Gateway first'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: msg.role === 'user'
                  ? 'linear-gradient(160deg, #2a4f84, #1e3a5f)'
                  : msg.role === 'system'
                  ? 'var(--bad-dim)'
                  : 'rgba(11, 20, 37, 0.9)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(76,196,255,0.2)' : 'var(--border-subtle)'}`,
              }}>
                {msg.agent && msg.role === 'assistant' && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: 2, fontWeight: 600 }}>
                    {msg.agent}
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{msg.timestamp}</div>
              </div>
            ))}
            {streaming && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(11, 20, 37, 0.9)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={gwStatus === 'connected' ? 'Type a message... (Enter to send)' : 'Connect to Gateway first'}
              disabled={gwStatus !== 'connected'}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                minHeight: '2.5rem',
                maxHeight: '8rem',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || gwStatus !== 'connected' || streaming}
              style={{ alignSelf: 'flex-end' }}
            >
              Send
            </button>
          </div>
        </Card>
      </div>

      <div style={{ height: '1.5rem' }} />
    </div>
  )
}
