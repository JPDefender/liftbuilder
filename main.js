const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;

// ── Auto-updater config ────────────────────────────────────────────────────
// Only used for version detection — unsigned apps can't use Squirrel.Mac install
autoUpdater.autoDownload = false;
autoUpdater.verifyUpdateCodeSignature = false;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info.version);
});

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update-not-available');
});

autoUpdater.on('error', () => {
  // Silently ignore — version check errors are non-critical
});

// ── IPC handlers (called from renderer via preload) ────────────────────────
ipcMain.handle('check-for-updates',  () => autoUpdater.checkForUpdates());
ipcMain.handle('open-releases-page', () => shell.openExternal('https://github.com/JPDefender/liftbuilder/releases/latest'));
ipcMain.handle('get-version',        () => app.getVersion());

// ── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'LiftBuilder',
    backgroundColor: '#0E0E0E',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates silently 5 seconds after launch
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
