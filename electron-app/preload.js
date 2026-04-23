const { contextBridge } = require('electron')

// Expose Electron flag to the React app
contextBridge.exposeInMainWorld('electronApp', {
  isElectron: true
})

window.addEventListener('DOMContentLoaded', () => {
  // Bypass the maintenance page — employees don't need to see it
  sessionStorage.setItem('level_maintenance_bypass', 'true')
})
