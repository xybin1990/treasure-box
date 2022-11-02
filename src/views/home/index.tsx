import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: 'Home',
  setup(props, ctx) {
    const router = useRouter()
    function handleRenameFile () {
      console.log('[router] jump')
      router.push('/rename-bilibili')
    }
    return () => (
      <div class="home-caontainer">
        <p class={['item']}>
          <button onClick={handleRenameFile}>批量重命名文件(去B站下载文件前缀)</button>
        </p>
      </div>
    )
  },
})
