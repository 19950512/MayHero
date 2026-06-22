const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let tray = null
let mainWindow = null

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

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const windowWidth = 420
  const windowHeight = 620

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth - 16,
    y: screenHeight - windowHeight - 16,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = isDev
    ? 'http://localhost:3069'
    : `file://${path.join(__dirname, '../out/index.html')}`

  mainWindow.loadURL(url)

  mainWindow.on('blur', () => {
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

function toggleWindow() {
  if (!mainWindow) {
    createWindow()
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

app.whenReady().then(() => {
  app.setName('May Hero')

  tray = new Tray(createTrayIcon())
  tray.setToolTip('May Hero')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir May Hero', click: toggleWindow },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ])

  tray.on('click', toggleWindow)
  tray.on('right-click', () => tray.popUpContextMenu(contextMenu))

  createWindow()
})

app.on('window-all-closed', () => {
  // Keep app running in tray even when window is closed
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide()
})

ipcMain.handle('get-app-version', () => app.getVersion())
