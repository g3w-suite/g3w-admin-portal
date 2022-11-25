import { en } from '@/locale/en';
import { it } from '@/locale/it';
import '@fontsource/titillium-web/400-italic.css';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/700-italic.css';
import '@fontsource/titillium-web/700.css';
import '@/icons';
import Vue from 'vue';
import Fragment from 'vue-fragment';
import VueI18n from 'vue-i18n';
import App from './App.vue';
import router from './router';
import store from './store';
import config from './config';

if (config.stylesheet) {
  const css = document.createElement('link');
  css.setAttribute('rel', 'stylesheet');
  css.setAttribute('href', config.stylesheet);
  document.body.appendChild(css);
}

if (config.theme) {
  document.documentElement.setAttribute('data-theme', config.theme);
}

if (config.favicon) {
  const icon = document.querySelector('link[rel~=\'icon\']') || document.createElement('link');
  icon.setAttribute('rel', 'icon');
  icon.setAttribute('href', config.favicon);
}

/**
 * Set all classes and id to customize in color
 */
const ELEMENT_TO_SET_CUSTOM_COLOR = {
  getElementsByClassName: [
    'header',
    'gradient',
    'g3wButton',
  ],
  getElementById: [],
};

Vue.use(Fragment.Plugin);
Vue.use(VueI18n);

Vue.config.productionTip = false;

export const i18n = new VueI18n({ locale: 'it', fallbackLocale: 'it', messages: { it, en } });

/**
 * Reusable Vue Breadcrumb component
 * 
 * 
 * @see https://github.com/NxtChg/pieces/tree/master/js/vue/vs-crumbs
 * @see https://github.com/samturrell/vue-breadcrumbs/
 * 
 * @requires vue-router
 * @requires runtimeCompiler: true
 */
// Vue.component('vs-crumbs',
// {
//   template:
//     `
//     <nav
//     v-if="crumbs.length > 1"
//     aria-label="breadcrumb"
//     class="container"
//   >
//     <ul>
//       <li v-for="(crumb, idx) in crumbs ">
//         <router-link
//           :to="crumb.path"
//           :aria-current="idx != crumbs.length - 1 ? undefined : 'page'"
//         >
//           {{ $t('messages.menu.' + crumb.name) }}
//         </router-link>
//       </li>
//     </ul>
//   </nav>
//     `,

//   props: { root: String },

//   computed: {
//     crumbs() {

//       if (!this.$route) return [];

//       let path = '/' + i18n.locale;
//       let title = (this.root || 'home');
//       const titleSeparator = ' | ';

//       let breadcrumbs = [ { name: title, path } ];

//       const route   = (this.$route.path                        ).split('/');
//       const matched = (this.$route.matched[1].meta.crumbs || '').split('/');

//       console.log(this.$route);
//       console.log(route, matched);

//       for(let i = 2; i < route.length; i++)
//       {
//         let name = (matched[i] || route[i]);
//         console.log(name);
        
//         if (route[i] == '') continue;

//         title += titleSeparator + i18n.t('messages.menu.' + name);
//         path  += '/'  + name;
    
//         breadcrumbs.push({ name: name, path: path });
//       }

//       window.document.title = title + titleSeparator + (store.getters['info/info'].title || 'G3W-SUITE');

//       return breadcrumbs;
//     }
//   }
// });

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
  created: () => {
    store.dispatch('info/fetchInfo', { locale: i18n.locale });
    store.dispatch('settings/portalSections', { sections: config.portal_sections });
    store.dispatch('settings/showAdminButton', { show: config.admin_btn });
    store.dispatch('settings/fetchPictures', { locale: i18n.locale });
  },
  async mounted() {
    await this.$nextTick();
    if ((window as any).CUSTOM_COLOR) {
      Object.keys(ELEMENT_TO_SET_CUSTOM_COLOR).forEach((elementSelectorType: string) => {
        const selectorElement = (ELEMENT_TO_SET_CUSTOM_COLOR as any)[elementSelectorType] || [];
        selectorElement.forEach((selector: string) => {
          const elements = (document as any)[elementSelectorType](selector);
          const elementsLength = elements.length;
          for (let i = 0; i < elementsLength; i++) {
            elements[i].style.backgroundColor = selector === 'g3wButton' ? 'orange' : 'yellow';
          }
        });
      });
    }
  },
}).$mount('#app');
