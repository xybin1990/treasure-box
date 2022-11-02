import { defineComponent } from 'vue';
import { RouterView } from 'vue-router';

export default defineComponent({
  name: 'App',
  setup(props, ctx) {
    return () => (<RouterView />)
  },
})
