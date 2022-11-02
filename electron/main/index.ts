// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, '../public')

import { app, BrowserWindow, shell, ipcMain, dialog, Notification, Menu } from 'electron'
import { readdir, rename } from 'node:fs/promises'
import path from 'path'
import { release } from 'os'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    show: false,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // 创建窗口的时候将 show 字段设置为 false 这里手动显示窗口
  // 可以解决窗口展示的时候页面还没渲染完成而造成的白屏问题
  win.once('ready-to-show', () => {
    win.show()
  })

  // 设置 菜单栏
  const menuTemplate = [
    {
      label: '帮助', submenu: [
        { label: '控制台', click: () => { win.webContents.openDevTools() } },
        { label: '关于', click: () => { console.log('[version]', app.getVersion()) } },
      ]
    },
    { label: '关于', },
  ]
  // 对于 OSX 而言，应用菜单的第一个菜单项是应用程序的名字
  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        { label: '退出百宝箱', click: () => app.quit() }
      ]
    })
  }
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // icon 只对 windows/linux 有效
  // 下面是 Mac dock 栏的设置方式
  // 且 Mac 下不认 ico 格式的文件 推荐用 png 格式文件
  if (process.platform === 'darwin') {
    app.dock.setIcon(join(process.env.PUBLIC, 'favicon.png'))
  }

  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.on('ready', () => {
  // 检查更新 github 众所周知的问题 暂时关闭更新
  // checkUpdate()
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})

// open-directory
ipcMain.on('open-directory', async (event, ...arg) => {
  const directory = dialog.showOpenDialogSync({
    title: '选择文件夹',
    properties: ['openDirectory'],
    message: '选择文件夹'
  })
  console.log('[select] path:', directory)
  // 需要返回信息可以直接用 reply 返回
  // event.reply('select-directory', 'ggggggg')
  // 也可以用 webContents
  // win?.webContents.send('select-directory', 'a','b','c')

  // 如果 renderer 使用 ipcRenderer.sendSync 方法 则 returnValue 必须要有值
  // event.returnValue = 'xxxxxxxx'
  if (!directory) {
    event.returnValue = directory
  } else {
    const dirpath = directory[0]
    const contentList = await readdir(dirpath, { withFileTypes: true })
    // 过滤文件 不要文件夹
    const fileList = contentList.filter(dirent => dirent.isFile())
    event.returnValue = {
      path: dirpath,
      children: fileList
    }
  }
})

// 打开系统文件资源管理器
ipcMain.on('open-finder', async (event, path) => {
  shell.showItemInFolder(path)
})

// 播放系统声音
ipcMain.on('beep', async (event, path) => {
  shell.beep()
})

// 应用 version 版本
ipcMain.on('version', (event) => {
  event.sender.send('version', { version: app.getVersion() })
})

// toast
ipcMain.on('toast-message', (event, msg) => {
  const notification = new Notification({
    title: '通知',
    body: msg,
    silent: true,
    sound: '/Library/Sounds'
  })
  notification.show()
})

// rename file
ipcMain.on('rename-file', async (event, dir: { dirpath: string; sourceName: string; targetName: string }) => {
  const contentList = await readdir(dir.dirpath, { withFileTypes: true })
  // 过滤文件 不要文件夹
  const fileList = contentList.filter(dirent => dirent.isFile())
  fileList.forEach(dirent => {
    if (dirent.name.startsWith(dir.sourceName)) {
      const target = dirent.name.replace(dir.sourceName, dir.targetName)
      rename(path.resolve(dir.dirpath, dirent.name), path.resolve(dir.dirpath, target)).catch(e => { })
      console.log('[replace]', target, 'success')
    }
  })
  const contentList2 = await readdir(dir.dirpath, { withFileTypes: true })
  // 过滤文件 不要文件夹
  const fileList2 = contentList2.filter(dirent => dirent.isFile())
  event.returnValue = {
    path: dir.dirpath,
    children: fileList2
  }
})

function checkUpdate() {
  // 检测更新
  autoUpdater.checkForUpdatesAndNotify()

  // error 事件
  autoUpdater.on('error', error => {
    console.error('[update]', error.message)
  })

  // 默认会自动下载新版本，如果不想自动下载，设置
  autoUpdater.autoDownload = false

  autoUpdater.on('checking-for-update', () => {
    console.info('[update]', '检测更新中')
  })

  autoUpdater.on('update-not-available', info => {
    console.info('[update] no update:', info)
  })

  autoUpdater.on('update-available', info => {
    console.info('[update]', info)
  })

  autoUpdater.on('download-progress', progress => {
    console.log('[update] progress',
      'Speed:', progress.bytesPerSecond,
      'Downloaded:', progress.percent, '%',
      '(',
      progress.transferred, '/', progress.total,
      ')'
    )
  })

  // 新版本下载完成时触发
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '更新百宝箱',
      message: '发现版本，是否更新？',
      buttons: ['是', '否']
    }).then(btnIdx => {
      if (btnIdx.response === 0) {
        autoUpdater.quitAndInstall()
        app.quit()
      }
    })
  })
}
