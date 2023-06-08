import { createPinia } from 'pinia';
import { router } from '@/plugins';
import { markRaw } from 'vue';
import { Router } from 'vue-router';

declare module 'pinia' {
  export interface PiniaCustomProperties {
      router: Router
  }
}

const pinia = createPinia();

pinia.use(({ store }) => { store.router = markRaw(router) }); 

export { pinia };