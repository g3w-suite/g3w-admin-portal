import { en } from '@/locale/en';
import { it } from '@/locale/it';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faFacebookSquare,
  faFlickr,
  faGooglePlusSquare,
  faInstagram,
  faLinkedin,
  faTwitterSquare,
  faYoutube,
  /* faTripadvisor */
} from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope,
  faExpandArrowsAlt,
  faGear,
  faHome,
  faInbox,
  faInfo,
  faKey,
  faLanguage,
  faMapMarkerAlt,
  faNewspaper,
  faPencilAlt,
  faPhoneAlt,
  faSearch,
  faSignOutAlt,
  faTimes,
  faUser,
  faUserLock,
  faUserSecret,
  faUserShield,
  faBars,
  faXmark,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Vue from 'vue';
import Fragment from 'vue-fragment';
import VueI18n from 'vue-i18n';
import App from './App.vue';
import router from './router';
import store from './store';

library.add(
  faUserShield,
  faUserSecret,
  faKey,
  faMapMarkerAlt,
  faInbox,
  faNewspaper,
  faInfo,
  faUserLock,
  faLanguage,
  faPhoneAlt,
  faEnvelope,
  faUser,
  faFacebookSquare,
  faGooglePlusSquare,
  faYoutube,
  faFlickr,
  /* faTripadvisor, */
  faTwitterSquare,
  faInstagram,
  faLinkedin,
  faExpandArrowsAlt,
  faTimes,
  faSignOutAlt,
  faPencilAlt,
  faSearch,
  faHome,
  faGear,
  faBars,
  faXmark,
  faArrowUpRightFromSquare,
);

Vue.use(Fragment.Plugin);
Vue.use(VueI18n);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;

export const i18n = new VueI18n({ locale: 'it', fallbackLocale: 'it', messages: { it, en } });

const opts  =  {
  favicon:    'https://www.comune.altamura.ba.it/templates/shaper_helixultimate/favicon.ico',
  stylesheet: 'https://unpkg.com/@picocss/pico@1.5.6/css/pico.min.css',
  theme:      'light'
}

if (opts.stylesheet) {
  const css = document.createElement('link');
  css.setAttribute('rel', 'stylesheet');
  css.setAttribute('href', opts.stylesheet);
  document.body.appendChild(css);
}

if (opts.theme) {
  document.documentElement.setAttribute('data-theme', opts.theme);
}

if (opts.favicon) {
  const icon = document.querySelector('link[rel~=\'icon\']') || document.createElement('link');
  icon.setAttribute('rel', 'icon');
  icon.setAttribute('href', opts.favicon);
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

const SUPPORTED_LANGUAGES = ['it', 'en'];
let LANGUAGES = ['it', 'en']; // default and supported languages
const global = (window as any);

if (global.LANGUAGES && Array.isArray(global.LANGUAGES)) {
  LANGUAGES = global.LANGUAGES
              .filter((lang: string)  => SUPPORTED_LANGUAGES.indexOf(lang) !== -1);
  if (LANGUAGES.length === 0) { LANGUAGES = [ 'it' ]; }
}

global.ADMIN_BTN = true;
global.PORTAL_SECTIONS = [
  'maps',
  'info',
];

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
  created: () => {
    store.dispatch('info/fetchInfo', { locale: i18n.locale });
    store.dispatch('settings/portalSections', { sections: global.PORTAL_SECTIONS });
    store.dispatch('settings/showAdminButton', { show: global.ADMIN_BTN });
    store.dispatch('settings/fetchPictures', { locale: i18n.locale });
  },
  async mounted() {
    await this.$nextTick();
    if (global.CUSTOM_COLOR) {
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
