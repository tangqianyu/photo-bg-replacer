import {
  app,
  BrowserWindow,
  screen,
  MenuItemConstructorOptions,
  Menu,
  ipcMain,
  dialog,
  shell
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;
  const template: MenuItemConstructorOptions[] = [];

  // Create the browser window.
  win = new BrowserWindow({
    width: (size.width * 0.8) | 0,
    height: (size.height * 0.8) | 0,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false // false if you want to run e2e test with Spectron
    }
  });
  win.center();
  win.setMinimumSize(400, 400);

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  ipcMain.on('file-download', (event, args) => {
    const { buffer, fileName } = args; // 通过 args 获取传递的 URL

    const saveOptions = {
      defaultPath: fileName
    };
    // 使用 dialog 模块选择文件保存路径
    const savePath = dialog.showSaveDialogSync(saveOptions);

    if (savePath) {
      fs.writeFile(savePath, Buffer.from(buffer), error => {
        if (error) {
          console.error(error);
          event.reply('file-download-reply', { success: false, error: error.message });
        } else {
          console.log('savePath==', savePath);
          event.reply('file-download-reply', { success: true, filePath: savePath });
        }
      });
    }
  });

  ipcMain.on('open-file-path', (event, args) => {
    const { filePath } = args;
    shell.showItemInFolder(filePath);
  });

  ipcMain.on('url-arraybuffer', (event, args) => {
    const { url } = args;
    https
      .get(url, response => {
        const chunks: any = [];

        response.on('data', chunk => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          );
          event.reply('url-arraybuffer-reply', { success: true, arrayBuffer });
        });
      })
      .on('error', error => {
        event.reply('url-arraybuffer-reply', { success: false, error: error.message });
      });
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
