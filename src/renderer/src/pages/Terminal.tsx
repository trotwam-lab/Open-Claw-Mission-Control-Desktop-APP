import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'

export function Terminal() {
  const termRef = useRef<HTMLDivElement>(null)
  const [initialized, setInitialized] = useState(false)
  const xtermRef = useRef<unknown>(null)

  useEffect(() => {
    if (!termRef.current || initialized) return

    // Dynamically import xterm to avoid SSR issues
    const initTerminal = async () => {
      try {
        const { Terminal: XTerm } = await import('xterm')
        const { FitAddon } = await import('xterm-addon-fit')
        const { WebLinksAddon } = await import('xterm-addon-web-links')

        // Import xterm CSS
        await import('xterm/css/xterm.css')

        const term = new XTerm({
          theme: {
            background: '#0b1424',
            foreground: '#e3ecff',
            cursor: '#4cc4ff',
            cursorAccent: '#0b1424',
            selectionBackground: 'rgba(76, 196, 255, 0.3)',
            black: '#0b1424',
            red: '#ff6f80',
            green: '#42df9f',
            yellow: '#ffd36e',
            blue: '#4cc4ff',
            magenta: '#c084fc',
            cyan: '#67e8f9',
            white: '#e3ecff',
          },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: 13,
          lineHeight: 1.3,
          cursorBlink: true,
          cursorStyle: 'bar',
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.loadAddon(new WebLinksAddon())
        term.open(termRef.current!)
        fitAddon.fit()

        // Welcome message
        term.writeln('\x1b[36m╔══════════════════════════════════════════╗\x1b[0m')
        term.writeln('\x1b[36m║   OpenClaw Mission Control Terminal      ║\x1b[0m')
        term.writeln('\x1b[36m╚══════════════════════════════════════════╝\x1b[0m')
        term.writeln('')

        // Handle input via Electron IPC or echo locally
        if (window.electronAPI) {
          window.electronAPI.terminal.create()

          term.onData((data) => {
            window.electronAPI!.terminal.sendInput(data)
          })

          window.electronAPI.terminal.onOutput((data) => {
            term.write(data)
          })

          term.writeln('\x1b[32mConnected to local shell.\x1b[0m')
        } else {
          // Browser fallback - simple command runner
          let currentLine = ''
          term.write('\x1b[33m$ \x1b[0m')

          term.onData((data) => {
            if (data === '\r') {
              term.writeln('')
              if (currentLine.trim()) {
                term.writeln(`\x1b[90m(Shell not available in browser mode)\x1b[0m`)
              }
              currentLine = ''
              term.write('\x1b[33m$ \x1b[0m')
            } else if (data === '\x7f') {
              if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1)
                term.write('\b \b')
              }
            } else if (data >= ' ') {
              currentLine += data
              term.write(data)
            }
          })

          term.writeln('\x1b[33mNote: Full shell requires Electron. Running in demo mode.\x1b[0m')
        }
        term.writeln('')

        // Resize observer
        const observer = new ResizeObserver(() => fitAddon.fit())
        observer.observe(termRef.current!)

        xtermRef.current = { term, fitAddon, observer }
        setInitialized(true)

        return () => {
          observer.disconnect()
          term.dispose()
        }
      } catch {
        // xterm not available
        if (termRef.current) {
          termRef.current.innerHTML = '<div style="padding: 2rem; color: var(--text-muted); text-align: center;">Terminal requires xterm.js — run `npm install` first</div>'
        }
      }
    }

    initTerminal()
  }, [initialized])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Terminal"
        subtitle="Embedded command line — run commands directly"
      />
      <div style={{
        flex: 1,
        margin: '0 1.5rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#0b1424',
      }}>
        <div ref={termRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  )
}
