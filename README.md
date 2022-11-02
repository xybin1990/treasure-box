# Treasure Box

- 配置alias
```javascript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src')
  }
}

// 同时 tsconfig.json 中需要配置
"compilerOptions": {
  "paths": {
    "@/*": ["src/*"]
  },
}
```

- vite 项目支持 jsx/tsx
```javascript
// vite.config.ts
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ]
  // ...
})
```
- 设置菜单栏
```javascript
// 设置 菜单栏
const menuTemplate = [
  { label: '帮助', submenu: [{ label: '控制台', click: () => { win.webContents.openDevTools() } }] },
  { label: '关于' },
]
// 对于 OSX 而言，应用菜单的第一个菜单项是应用程序的名字
if (process.platform === 'darwin') {
  menuTemplate.unshift({
    label: app.getName(),
    submenu: [
      { label: '退出', click: () => app.quit() }
    ]
  })
}
const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)
```

- 修改打包文件名
```json
// electron-builder.json5
// 配置 productName 字段
// 如果默认不配置 将使用 package.json 中的 name 字段
{
  "appId": "com.nic.treasure-box",
  "productName": "百宝箱",
  ...
}
```
