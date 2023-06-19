import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { generateRandomFileName } from '../../../shared/utils/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  constructor(private msg: NzMessageService, private notification: NzNotificationService) {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      this.fs = window.require('fs');

      this.childProcess = window.require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  downloadImage(buffer: ArrayBuffer, callback: () => void) {
    if (this.isElectron) {
      this.ipcRenderer.send('file-download', { buffer, fileName: generateRandomFileName('.jpg') });
      this.ipcRenderer.on('file-download-reply', (event, args) => {
        if (args.success) {
          callback();
          this.notification
            .create('success', '文件下载成功', '点击打开文件下载路径', { nzDuration: 0 })
            .onClick.subscribe(() => {
              this.ipcRenderer.send('open-file-path', { filePath: args.filePath });
            });
        } else {
          callback();
          this.msg.success('文件下载失败：' + args.error);
        }
      });
    } else {
      const blob = new Blob([buffer]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateRandomFileName('.jpg');
      link.click();
      window.URL.revokeObjectURL(url);
      callback();
    }
  }

  convertImageUrlToArrayBuffer(url: string, callback: (arraybuffer: ArrayBuffer) => void) {
    if (this.isElectron) {
      this.ipcRenderer.send('url-arraybuffer', { url });
      this.ipcRenderer.on('url-arraybuffer-reply', (event, args) => {
        if (args.success) {
          callback(args.arrayBuffer);
        } else {
          this.msg.success('url转换失败：' + args.error);
        }
      });
    } else {
      this.msg.warning('仅支持在Electron中操作');
    }
  }
}