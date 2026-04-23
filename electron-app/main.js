const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const STAFF_URL = 'https://levelstudios.ca/loginteamlevelprivate'

// Silent update check — download in background, prompt on completion
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de Level Studios a été téléchargée.',
    detail: 'L\'application va redémarrer pour installer la mise à jour.',
    buttons: ['Redémarrer maintenant', 'Plus tard'],
    defaultId: 0,
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', (err) => {
  // Silent — don't bother the user if update check fails
  console.error('Update error:', err.message)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Level Studios',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#060606',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  })

  Menu.setApplicationMenu(null)

  win.loadURL(STAFF_URL)

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://levelstudios.ca')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  createWindow()

  // Check for updates 3 seconds after launch (let the window load first)
  setTimeout(() => autoUpdater.checkForUpdates(), 3000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
