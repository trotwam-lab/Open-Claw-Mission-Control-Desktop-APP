import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { GatewayService } from './gateway'

let mainWindow: BrowserWindow | null = null
let gateway: GatewayService | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'OpenClaw Mission Control',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#070b16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupIPC() {
  // Gateway connection
  ipcMain.handle('gateway:connect', async (_event, config: { url: string; token?: string }) => {
    gateway = new GatewayService(config.url, config.token)
    gateway.onEvent((event) => {
      mainWindow?.webContents.send('gateway:event', event)
    })
    gateway.onStatusChange((status) => {
      mainWindow?.webContents.send('gateway:status', status)
    })
    return gateway.connect()
  })

  ipcMain.handle('gateway:disconnect', async () => {
    gateway?.disconnect()
    gateway = null
  })

  ipcMain.handle('gateway:rpc', async (_event, method: string, params?: Record<string, unknown>) => {
    if (!gateway) throw new Error('Gateway not connected')
    return gateway.rpc(method, params)
  })

  ipcMain.handle('gateway:getStatus', () => {
    return gateway?.getStatus() ?? 'disconnected'
  })

  // Shell execution for embedded terminal
  ipcMain.handle('shell:spawn', async (_event, command: string) => {
    const { exec } = await import('child_process')
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) reject(error.message)
        else resolve({ stdout, stderr })
      })
    })
  })

  // PTY for terminal - will be set up when xterm connects
  ipcMain.handle('terminal:create', async () => {
    // Return a session ID; actual PTY managed via events
    return { sessionId: `term-${Date.now()}` }
  })

  ipcMain.on('terminal:input', (_event, data: string) => {
    // Forward to PTY when available
    mainWindow?.webContents.send('terminal:output', data)
  })

  // App info
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getPlatform', () => process.platform)
}

app.whenReady().then(() => {
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  gateway?.disconnect()
  if (process.platform !== 'darwin') app.quit()
})
