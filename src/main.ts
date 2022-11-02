import { createApp } from 'vue'
import App from './App'
import router from './router'
import './samples/node-api'

createApp(App)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
