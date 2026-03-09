// Gateway service for the renderer process — talks to main process via IPC,
// or falls back to direct WebSocket for browser-only dev mode.

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

type EventCallback = (event: GatewayEvent) => void
type StatusCallback = (status: ConnectionStatus) => void

class GatewayClient {
  private status: ConnectionStatus = 'disconnected'
  private eventCallbacks: EventCallback[] = []
  private statusCallbacks: StatusCallback[] = []
  private cleanupFns: Array<() => void> = []
  private directWs: WebSocket | null = null
  private requestId = 0
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

  private get isElectron() {
    return !!window.electronAPI
  }

  async connect(url: string, token?: string): Promise<boolean> {
    this.setStatus('connecting')

    if (this.isElectron) {
      const cleanup1 = window.electronAPI!.gateway.onEvent((event) => {
        this.eventCallbacks.forEach(cb => cb(event))
      })
      const cleanup2 = window.electronAPI!.gateway.onStatusChange((status) => {
        this.setStatus(status as ConnectionStatus)
      })
      this.cleanupFns.push(cleanup1, cleanup2)
      const result = await window.electronAPI!.gateway.connect({ url, token })
      if (result) this.setStatus('connected')
      else this.setStatus('error')
      return result
    }

    // Direct WebSocket fallback for browser dev
    return this.connectDirect(url, token)
  }

  private connectDirect(url: string, token?: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const wsUrl = new URL(url)
        if (token) wsUrl.searchParams.set('token', token)
        wsUrl.searchParams.set('v', '3')
        wsUrl.searchParams.set('role', 'operator')
        this.directWs = new WebSocket(wsUrl.toString())
      } catch {
        this.setStatus('error')
        resolve(false)
        return
      }

      this.directWs!.onopen = () => {
        this.setStatus('connected')
        resolve(true)
      }
      this.directWs!.onmessage = (ev) => {
        try {
          const frame = JSON.parse(ev.data)
          if (frame.type === 'event') {
            this.eventCallbacks.forEach(cb => cb(frame))
          } else if (frame.type === 'response' && frame.id) {
            const p = this.pending.get(frame.id)
            if (p) {
              this.pending.delete(frame.id)
              if (frame.error) p.reject(new Error(frame.error.message))
              else p.resolve(frame.result)
            }
          }
        } catch { /* ignore */ }
      }
      this.directWs!.onerror = () => {
        this.setStatus('error')
        resolve(false)
      }
      this.directWs!.onclose = () => {
        this.setStatus('disconnected')
      }
    })
  }

  disconnect() {
    this.cleanupFns.forEach(fn => fn())
    this.cleanupFns = []
    this.directWs?.close()
    this.directWs = null
    if (this.isElectron) window.electronAPI!.gateway.disconnect()
    this.setStatus('disconnected')
  }

  async rpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (this.isElectron) {
      return window.electronAPI!.gateway.rpc(method, params)
    }

    // Direct WS RPC
    if (!this.directWs || this.status !== 'connected') {
      throw new Error('Not connected')
    }
    const id = `req-${++this.requestId}`
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.directWs!.send(JSON.stringify({ type: 'request', id, method, params }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`Timeout: ${method}`))
        }
      }, 30000)
    })
  }

  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.push(callback)
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback)
    }
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback)
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback)
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.statusCallbacks.forEach(cb => cb(status))
  }
}

export const gateway = new GatewayClient()
