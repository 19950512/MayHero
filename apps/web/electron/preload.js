const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isElectron: true,
})
