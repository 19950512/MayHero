const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, shell } = require('electron')
const fs = require('fs/promises')
const http = require('http')
const os = require('os')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let tray = null
let mainWindow = null
let staticServer = null
let staticServerUrl = null

const OUT_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'out')
  : path.join(__dirname, '../out')
const externalSiteUrl = process.env.EXTERNAL_SITE_URL || process.env.WEB_URL || 'http://localhost:3069'
const hideOnBlur = process.env.MAYHERO_HIDE_ON_BLUR === 'true'
const trayMode = process.env.MAYHERO_TRAY_MODE !== 'false'
const LOG_FILE = path.join(os.homedir(), '.config', 'May Hero', 'electron.log')

async function logLine(message) {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
    const line = `[${new Date().toISOString()}] ${message}\n`
    await fs.appendFile(LOG_FILE, line, 'utf8')
  } catch {}
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8'
    case '.js': return 'application/javascript; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.json': return 'application/json; charset=utf-8'
    case '.svg': return 'image/svg+xml'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.ico': return 'image/x-icon'
    case '.woff2': return 'font/woff2'
    case '.woff': return 'font/woff'
    case '.ttf': return 'font/ttf'
    default: return 'application/octet-stream'
  }
}

async function resolveRequestPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname)
  const normalized = path.normalize(path.join(OUT_DIR, decoded))
  if (!normalized.startsWith(OUT_DIR)) return null

  try {
    const stat = await fs.stat(normalized)
    if (stat.isDirectory()) {
      const indexPath = path.join(normalized, 'index.html')
      await fs.access(indexPath)
      return indexPath
    }
    return normalized
  } catch {
    return null
  }
}

async function startStaticServer() {
  if (isDev) return null
  if (staticServerUrl) return staticServerUrl

  await fs.access(OUT_DIR)
  await logLine(`static server root: ${OUT_DIR}`)

  return await new Promise((resolve, reject) => {
    staticServer = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url || '/', 'http://127.0.0.1')
        let filePath = await resolveRequestPath(reqUrl.pathname)

        // SPA fallback for client-side routes.
        if (!filePath) {
          filePath = path.join(OUT_DIR, 'index.html')
        }

        const buffer = await fs.readFile(filePath)
        res.writeHead(200, {
          'Content-Type': contentTypeFor(filePath),
          'Cache-Control': 'no-cache',
        })
        res.end(buffer)
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
      }
    })

    staticServer.once('error', reject)
    staticServer.listen(0, '127.0.0.1', () => {
      const addr = staticServer.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('failed to start static server'))
        return
      }
      staticServerUrl = `http://127.0.0.1:${addr.port}`
      void logLine(`static server started: ${staticServerUrl}`)
      resolve(staticServerUrl)
    })
  })
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, '../public/assets/tray-icon.png')
  let icon
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) throw new Error('empty')
  } catch {
    // Fallback: create a simple colored icon
    icon = nativeImage.createFromDataURL(generateTrayIconDataURL())
  }
  return icon.resize({ width: 22, height: 22 })
}

function generateTrayIconDataURL() {
  // Simple sword icon as data URL (16x16 canvas encoded)
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAq0lEQVQ4jc2TMQqDQBBFn4uHsBfYC3iJXMBb5BJewFPYWFiKoIWFhYWIiIiIiIiIuIuIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIj9AW4kBjWLLiahAAAAAElFTkSuQmCC'
}

async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const windowWidth = trayMode ? 420 : 1100
  const windowHeight = trayMode ? 620 : 760

  const windowOptions = {
    width: windowWidth,
    height: windowHeight,
    frame: !trayMode,
    resizable: !trayMode,
    transparent: false,
    alwaysOnTop: trayMode,
    // Keep it reachable even on Linux desktops where tray icons may be hidden.
    skipTaskbar: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  }

  if (trayMode) {
    windowOptions.x = screenWidth - windowWidth - 16
    windowOptions.y = screenHeight - windowHeight - 16
  } else {
    windowOptions.center = true
  }

  mainWindow = new BrowserWindow(windowOptions)

  const url = isDev
    ? 'http://localhost:3069'
    : `${await startStaticServer()}/`

  await logLine(`loading url: ${url}`)

  await mainWindow.loadURL(url)

  mainWindow.webContents.on('did-fail-load', (_event, code, desc, validatedUrl) => {
    void logLine(`did-fail-load code=${code} desc=${desc} url=${validatedUrl}`)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    void logLine(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`)
  })

  mainWindow.on('blur', () => {
    if (!hideOnBlur) return
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

async function toggleWindow() {
  if (!mainWindow) {
    await createWindow()
    mainWindow.show()
    return
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    repositionWindow()
    mainWindow.show()
    mainWindow.focus()
  }
}

function repositionWindow() {
  if (!mainWindow || !tray) return
  const trayBounds = tray.getBounds()
  const windowBounds = mainWindow.getBounds()
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  let y = Math.round(trayBounds.y + trayBounds.height + 4)

  // If tray is at bottom, place window above it
  if (trayBounds.y > screenHeight / 2) {
    y = Math.round(trayBounds.y - windowBounds.height - 4)
  }

  x = Math.max(8, Math.min(x, screenWidth - windowBounds.width - 8))
  mainWindow.setPosition(x, y, false)
}

app.commandLine.appendSwitch('no-sandbox')
if (process.platform === 'linux' && !isDev) {
  // Avoid compositor/GPU issues that can cause black window/flicker on some Linux desktops.
  app.disableHardwareAcceleration()
}

// Catch any unhandled errors and log them so we can diagnose silent crashes.
process.on('uncaughtException', (err) => {
  void logLine(`uncaughtException: ${err?.stack || err}`)
})
process.on('unhandledRejection', (reason) => {
  void logLine(`unhandledRejection: ${reason?.stack || reason}`)
})

app.whenReady().then(async () => {
  try {
    await logLine(`app ready. trayMode=${trayMode} hideOnBlur=${hideOnBlur}`)
    app.setName('May Hero')

    // Tray creation can fail silently on some Linux DEs without systray support.
    try {
      tray = new Tray(createTrayIcon())
      tray.setToolTip('May Hero')

      const contextMenu = Menu.buildFromTemplate([
        { label: 'Abrir Site', click: () => { void shell.openExternal(externalSiteUrl) } },
        { label: 'Fechar o jogo', click: () => app.quit() },
      ])

      tray.on('click', () => { void toggleWindow() })
      tray.on('right-click', () => tray.popUpContextMenu(contextMenu))
      await logLine('tray created successfully')
    } catch (trayErr) {
      await logLine(`tray creation failed (non-fatal): ${trayErr?.message || trayErr}`)
    }

    await logLine('calling createWindow...')
    await createWindow()
    await logLine('createWindow returned')

    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      await logLine('window shown and focused')
    } else {
      await logLine('mainWindow is null after createWindow!')
    }
  } catch (err) {
    await logLine(`FATAL in app.whenReady: ${err?.stack || err}`)
  }
})

app.on('window-all-closed', () => {
  // Keep app running in tray even when window is closed
})

app.on('activate', () => {
  if (!mainWindow) {
    void createWindow()
  }
})

app.on('before-quit', () => {
  void logLine('before-quit')
  if (staticServer) {
    staticServer.close()
    staticServer = null
    staticServerUrl = null
  }
})

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide()
})

ipcMain.handle('get-app-version', () => app.getVersion())
