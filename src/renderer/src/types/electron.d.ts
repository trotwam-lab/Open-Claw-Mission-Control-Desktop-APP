interface GatewayConfig {
  url: string
  token?: string
}

interface GatewayEvent {
  type: string
  event?: string
  data?: unknown
}

interface ElectronAPI {
  gateway: {
    connect: (config: GatewayConfig) => Promise<boolean>
    disconnect: () => Promise<void>
    rpc: (method: string, params?: Record<string, unknown>) => Promise<unknown>
    getStatus: () => Promise<string>
    onEvent: (callback: (event: GatewayEvent) => void) => () => void
    onStatusChange: (callback: (status: string) => void) => () => void
  }
  terminal: {
    create: () => Promise<{ sessionId: string }>
    sendInput: (data: string) => void
    onOutput: (callback: (data: string) => void) => () => void
  }
  app: {
    getVersion: () => Promise<string>
    getPlatform: () => Promise<string>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
