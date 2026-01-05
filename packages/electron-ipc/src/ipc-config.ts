import { ipcMain, dialog, Notification, BrowserWindow } from 'electron';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { is } from '@electron-toolkit/utils';

const execAsync = promisify(exec);

export class IpcConfig {
  private mainWindow: BrowserWindow | null;

  constructor(mainWindow: BrowserWindow | null = null) {
    this.mainWindow = mainWindow;
  }

  updateMainWindow(mainWindow: BrowserWindow | null): void {
    this.mainWindow = mainWindow;
  }

  setupHandlers(): void {
    this.setupFileHandlers();
    this.setupNotificationHandlers();
    this.setupWindowHandlers();
    this.setupDebugHandlers();
    this.setupAppStatusHandlers();
    this.setupCommandHandlers();
  }

  private setupFileHandlers(): void {
    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          {
            name: '视频文件',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'],
          },
          { name: '所有文件', extensions: ['*'] },
          { name: '文本文件', extensions: ['txt', 'md'] },
          { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
        ],
      });

      return result;
    });

    ipcMain.handle('save-file-dialog', async () => {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        filters: [
          { name: '文本文件', extensions: ['txt'] },
          { name: 'Markdown 文件', extensions: ['md'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      return result;
    });
  }

  private setupNotificationHandlers(): void {
    ipcMain.handle('show-notification', (_, title, body) => {
      if (Notification.isSupported()) {
        new Notification({
          title,
          body,
          icon: join(__dirname, '../../resources/icon.png'),
        }).show();
      }
    });
  }

  private setupWindowHandlers(): void {
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.close();
    });
  }

  private setupDebugHandlers(): void {
    ipcMain.handle('open-devtools', () => {
      this.mainWindow?.webContents.openDevTools();
    });

    ipcMain.handle('close-devtools', () => {
      this.mainWindow?.webContents.closeDevTools();
    });

    ipcMain.handle('toggle-devtools', () => {
      if (this.mainWindow?.webContents.isDevToolsOpened()) {
        this.mainWindow.webContents.closeDevTools();
      } else {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    ipcMain.handle('log-to-console', (_, message, level = 'info') => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      switch (level) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }

      return logMessage;
    });
  }

  private setupAppStatusHandlers(): void {
    ipcMain.handle('get-app-status', () => {
      return {
        isDev: is.dev,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        windowCount: BrowserWindow.getAllWindows().length,
        isDevToolsOpen: this.mainWindow?.webContents.isDevToolsOpened() || false,
      };
    });

    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
      };
    });

    ipcMain.handle('get-app-version', () => {
      return process.env.npm_package_version || '1.0.0';
    });

    ipcMain.handle('get-platform', () => {
      return process.platform;
    });
  }

  private setupCommandHandlers(): void {
    // 执行系统命令
    ipcMain.handle('execute-command', async (_, command: string) => {
      try {
        console.log(`执行命令: ${command}`);

        // 在 macOS 上执行命令
        const { stdout, stderr } = await execAsync(command, {
          timeout: 30000, // 30秒超时
          maxBuffer: 1024 * 1024 * 10, // 10MB 缓冲区
        });

        if (stderr && !stdout) {
          // 有些命令会将输出写入 stderr（如某些 macOS 命令）
          return { success: true, output: stderr, error: null };
        }

        return { success: true, output: stdout, error: null };
      } catch (error: any) {
        console.error('执行命令失败:', error);

        return {
          success: false,
          output: null,
          error: error.message || '执行命令时发生未知错误',
        };
      }
    });
  }
}
