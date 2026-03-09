import { contextBridge, ipcRenderer } from 'electron'

export interface GatewayConfig {
  url: string
  token?: string
}

const api = {
  gateway: {
    connect: (config: GatewayConfig) => ipcRenderer.invoke('gateway:connect', config),
    disconnect: () => ipcRenderer.invoke('gateway:disconnect'),
    rpc: (method: string, params?: Record<string, unknown>) =>
      ipcRenderer.invoke('gateway:rpc', method, params),
    getStatus: () => ipcRenderer.invoke('gateway:getStatus'),
    onEvent: (callback: (event: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('gateway:event', listener)
      return () => ipcRenderer.removeListener('gateway:event', listener)
    },
    onStatusChange: (callback: (status: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: string) => callback(status)
      ipcRenderer.on('gateway:status', listener)
      return () => ipcRenderer.removeListener('gateway:status', listener)
    }
  },
  terminal: {
    create: () => ipcRenderer.invoke('terminal:create'),
    sendInput: (data: string) => ipcRenderer.send('terminal:input', data),
    onOutput: (callback: (data: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
      ipcRenderer.on('terminal:output', listener)
      return () => ipcRenderer.removeListener('terminal:output', listener)
    }
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
