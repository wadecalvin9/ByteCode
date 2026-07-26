'use strict';

const { app, BrowserWindow, Tray, Menu, shell, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const SERVER_URL = `http://localhost:${PORT}`;
const SERVER_ENTRY = path.join(__dirname, '../server/src/index.js');
// Use app.isPackaged — works on all platforms without cross-env
const IS_DEV = !app.isPackaged;

// ── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;

// ── Helpers ──────────────────────────────────────────────────────────────────
function waitForServer(url, retries = 40, delayMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function tryConnect() {
      http.get(`${url}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    }

    function retry() {
      attempts++;
      if (attempts >= retries) {
        reject(new Error('Server did not start in time'));
      } else {
        setTimeout(tryConnect, delayMs);
      }
    }

    tryConnect();
  });
}

// ── Server ───────────────────────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('[ELECTRON] Spawning server:', SERVER_ENTRY);

    // Use system node (from PATH), NOT process.execPath (which is the Electron binary).
    // Electron embeds its own Node with a different ABI — native addons like
    // better-sqlite3 are compiled for system Node and would crash inside Electron's runtime.
    const nodeBin = process.platform === 'win32' ? 'node.exe' : 'node';

    serverProcess = spawn(nodeBin, [SERVER_ENTRY], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: IS_DEV ? 'development' : 'production',
        // Explicit absolute DB path so it resolves correctly regardless of cwd
        DB_PATH: IS_DEV
          ? path.join(__dirname, '../server/data/bytecode.db')
          : path.join(app.getPath('userData'), 'data', 'bytecode.db'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => {
      process.stdout.write(`[SERVER] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(`[SERVER ERR] ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('[ELECTRON] Failed to spawn server:', err.message);
      reject(err);
    });

    serverProcess.on('close', (code) => {
      if (!isQuitting) {
        console.warn(`[ELECTRON] Server exited unexpectedly with code ${code}`);
      }
    });

    // Resolve once the HTTP health endpoint responds
    waitForServer(SERVER_URL)
      .then(resolve)
      .catch(reject);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

// ── Windows ───────────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,          // Use custom title bar in the dashboard
    backgroundColor: '#0a0b0f',
    show: false,
    icon: getIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in the OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function getIcon() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  return fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
}

function createTray() {
  tray = new Tray(getIcon());
  tray.setToolTip('ByteCode C2');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open ByteCode',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Open in Browser',
      click: () => shell.openExternal(SERVER_URL),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:minimize', () => mainWindow?.minimize());
ipcMain.handle('app:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('app:close', () => {
  mainWindow?.hide();
});
ipcMain.handle('app:quit', () => {
  isQuitting = true;
  app.quit();
});
ipcMain.handle('app:isMaximized', () => mainWindow?.isMaximized() ?? false);

// ── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash();

  try {
    await startServer();
    createMainWindow();
    createTray();
  } catch (err) {
    console.error('[ELECTRON] Server failed to start:', err.message);
    // Show error in splash before quitting
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(
        `document.getElementById('status').textContent = 'Server failed to start. Check logs.'; document.getElementById('status').style.color = '#ff4444';`
      );
    }
    setTimeout(() => app.quit(), 3000);
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

app.on('window-all-closed', () => {
  // On macOS keep app alive in tray
  if (process.platform !== 'darwin') {
    // We hide instead of close, so this won't fire unless isQuitting
    if (isQuitting) {
      stopServer();
      app.quit();
    }
  }
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
