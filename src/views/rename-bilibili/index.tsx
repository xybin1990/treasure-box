import { defineComponent, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ipcRenderer } from 'electron'

export default defineComponent({
  name: 'RenameBilibili',
  setup(props, ctx) {
    const router = useRouter()
    const dirpath = ref('')
    const sourceName = ref('')
    const targetName = ref('')
    const fileList = ref<Array<{ name: string }>>([])

    onMounted(() => {
      ipcRenderer.on('select-directory', (event, ...args) => {
        console.log('[Receive Main-process message] event:', event)
        console.log('[Receive Main-process message] args:', args)
      })
    })

    // back home
    function handleBackHome() {
      router.push('/')
    }

    // 渲染文件列表
    function _renderFileList () {
      console.log('[filelist]', fileList.value)
      return (
        <ul>
          {
            fileList.value.map(file => (
              <li>{file.name}</li>
            ))
          }
        </ul>
      )
    }

    // 打开选择文件夹对话框
    function handleOpenDirectory() {
      const data = ipcRenderer.sendSync('open-directory')
      if (!data) {
        ipcRenderer.send('beep')
        return ipcRenderer.send('toast-message', '取消选择文件夹')
      } else {
        const dirInfo = data
        console.log('[Info]', dirInfo)
        dirpath.value = dirInfo.path
        fileList.value = dirInfo.children
      }
    }

    // 打开访达
    function handleOpenFinder () {
      if (dirpath.value) {
        ipcRenderer.send('open-finder', dirpath.value)
      } else {
        ipcRenderer.send('beep')
      }
    }

    // 提交重命名
    function handleRename () {
      console.log('[debug] source name:', sourceName.value)
      console.log('[debug] target name:', targetName.value)
      if (!dirpath.value) {
        ipcRenderer.send('beep')
        return ipcRenderer.send('toast-message', '未选择文件夹')
      }
      if (!sourceName.value) {
        ipcRenderer.send('beep')
        return ipcRenderer.send('toast-message', '替换内容为空')
      }
      const data = ipcRenderer.sendSync('rename-file', {
        dirpath: dirpath.value,
        sourceName: sourceName.value,
        targetName: targetName.value || ''
      })
      dirpath.value = data.path
      fileList.value = data.children
    }

    // 监听数据变化
    function updateSourceName (e: any) {
      sourceName.value = e.target.value
    }
    function updateTargetName (e: any) {
      targetName.value = e.target.value
    }

    // 重置数据
    function handleSet () {
      dirpath.value = ''
      sourceName.value = ''
      targetName.value = ''
      fileList.value = []
    }

    return () => (
      <div class={'rename-container'}>
        <button onClick={ handleBackHome }>返回首页</button>
        <p>
          <button onClick={ handleOpenDirectory }>选择文件夹</button>
          <button onClick={ handleOpenFinder }>打开文件夹</button>
        </p>
        <p>
          <input type="text" value={sourceName.value} onInput={updateSourceName} placeholder='需要被替换的字段' />
          <input type="text" value={targetName.value} onInput={updateTargetName} placeholder='替换内容' />
          <button onClick={ handleRename }>替换</button>
          <button onClick={ handleSet }>重置</button>
          </p>
        <p>{ dirpath.value }</p>
        { _renderFileList() }
      </div>
    )
  },
})
