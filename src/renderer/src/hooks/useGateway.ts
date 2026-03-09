import { useState, useEffect, useCallback, useRef } from 'react'
import { gateway, ConnectionStatus } from '../services/gateway'

export function useGatewayStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(gateway.getStatus())

  useEffect(() => {
    return gateway.onStatusChange(setStatus)
  }, [])

  return status
}

export function useGatewayConnect() {
  const [status, setStatus] = useState<ConnectionStatus>(gateway.getStatus())

  useEffect(() => {
    return gateway.onStatusChange(setStatus)
  }, [])

  const connect = useCallback(async (url: string, token?: string) => {
    return gateway.connect(url, token)
  }, [])

  const disconnect = useCallback(() => {
    gateway.disconnect()
  }, [])

  return { status, connect, disconnect }
}

export function useGatewayRpc<T = unknown>(method: string, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const status = useGatewayStatus()

  const fetch = useCallback(async () => {
    if (status !== 'connected') return
    setLoading(true)
    setError(null)
    try {
      const result = await gateway.rpc(method, params) as T
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RPC failed')
    } finally {
      setLoading(false)
    }
  }, [method, status, JSON.stringify(params)])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, error, loading, refetch: fetch }
}

export function useGatewayEvents(eventFilter?: string) {
  const [events, setEvents] = useState<GatewayEvent[]>([])
  const maxEvents = 200
  const filterRef = useRef(eventFilter)
  filterRef.current = eventFilter

  useEffect(() => {
    return gateway.onEvent((event) => {
      if (filterRef.current && event.event !== filterRef.current) return
      setEvents(prev => [event, ...prev].slice(0, maxEvents))
    })
  }, [])

  const clear = useCallback(() => setEvents([]), [])

  return { events, clear }
}

export { gateway }
