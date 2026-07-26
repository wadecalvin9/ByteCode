'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API surface to the renderer (dashboard)
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  quit: () => ipcRenderer.invoke('app:quit'),
  isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
  isElectron: true,
});
