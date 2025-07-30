const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, 
      webSecurity: false // this is when i told you i disabled it so to access the internet without them coming after my skin
    }
  });

  win.loadFile('index.html');

  // Handle downloads
  win.webContents.session.on('will-download', (event, item, webContents) => {
    // Set the save path - you can customize this
    const downloadPath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(downloadPath);

    // Send download info to renderer
    win.webContents.send('download-started', {
      filename: item.getFilename(),
      url: item.getURL(),
      path: downloadPath,
      totalBytes: item.getTotalBytes()
    });

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused');
        } else {
          win.webContents.send('download-progress', {
            filename: item.getFilename(),
            receivedBytes: item.getReceivedBytes(),
            totalBytes: item.getTotalBytes()
          });
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        win.webContents.send('download-completed', {
          filename: item.getFilename(),
          path: downloadPath
        });
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });
}

// IPC handlers for file operations
ipcMain.handle('open-downloads-folder', async () => {
  const downloadsPath = app.getPath('downloads');
  shell.openPath(downloadsPath);
});

ipcMain.handle('export-data', async (event, data, filename) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, path: filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});