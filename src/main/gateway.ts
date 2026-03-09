import WebSocket from 'ws'

export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface GatewayFrame {
  type: 'request' | 'response' | 'event'
  id?: string
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: { code: number; message: string }
  event?: string
  data?: unknown
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

export class GatewayService {
  private ws: WebSocket | null = null
  private url: string
  private token?: string
  private status: GatewayStatus = 'disconnected'
  private requestId = 0
  private pending = new Map<string, PendingRequest>()
  private eventListeners: Array<(event: GatewayFrame) => void> = []
  private statusListeners: Array<(status: GatewayStatus) => void> = []
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  constructor(url: string, token?: string) {
    this.url = url
    this.token = token
  }

  onEvent(listener: (event: GatewayFrame) => void) {
    this.eventListeners.push(listener)
  }

  onStatusChange(listener: (status: GatewayStatus) => void) {
    this.statusListeners.push(listener)
  }

  getStatus(): GatewayStatus {
    return this.status
  }

  private setStatus(status: GatewayStatus) {
    this.status = status
    this.statusListeners.forEach(fn => fn(status))
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.setStatus('connecting')

      const wsUrl = new URL(this.url)
      if (this.token) {
        wsUrl.searchParams.set('token', this.token)
      }
      // Protocol version 3
      wsUrl.searchParams.set('v', '3')
      wsUrl.searchParams.set('role', 'operator')
      wsUrl.searchParams.set('scopes', 'operator.read,operator.write,operator.approvals')

      try {
        this.ws = new WebSocket(wsUrl.toString())
      } catch {
        this.setStatus('error')
        resolve(false)
        return
      }

      this.ws.on('open', () => {
        this.setStatus('connected')
        this.reconnectAttempts = 0
        resolve(true)
      })

      this.ws.on('message', (raw: WebSocket.Data) => {
        try {
          const frame: GatewayFrame = JSON.parse(raw.toString())
          this.handleFrame(frame)
        } catch {
          // Ignore malformed frames
        }
      })

      this.ws.on('close', () => {
        this.setStatus('disconnected')
        this.rejectAllPending()
        this.scheduleReconnect()
      })

      this.ws.on('error', () => {
        this.setStatus('error')
        resolve(false)
      })
    })
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts // prevent reconnect
    this.ws?.close()
    this.ws = null
    this.setStatus('disconnected')
    this.rejectAllPending()
  }

  async rpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || this.status !== 'connected') {
      throw new Error('Gateway not connected')
    }

    const id = `req-${++this.requestId}`
    const frame: GatewayFrame = { type: 'request', id, method, params }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`RPC timeout: ${method}`))
      }, 30000)

      this.pending.set(id, { resolve, reject, timer })
      this.ws!.send(JSON.stringify(frame))
    })
  }

  private handleFrame(frame: GatewayFrame) {
    if (frame.type === 'response' && frame.id) {
      const pending = this.pending.get(frame.id)
      if (pending) {
        clearTimeout(pending.timer)
        this.pending.delete(frame.id)
        if (frame.error) {
          pending.reject(new Error(frame.error.message))
        } else {
          pending.resolve(frame.result)
        }
      }
    } else if (frame.type === 'event') {
      this.eventListeners.forEach(fn => fn(frame))
    }
  }

  private rejectAllPending() {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error('Connection lost'))
      this.pending.delete(id)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }
}
