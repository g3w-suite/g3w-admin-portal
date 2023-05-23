import * as VueI18n from 'vue-i18n';
import { en } from '@/locale/en';
import { it } from '@/locale/it';

// import { loadLanguageAsync } from '@/utils'; 

const i18n = VueI18n.createI18n({
  locale: document.documentElement.lang || 'en',
  fallbackLocale: 'en',
  messages: { en, it },
  globalInjection: true,
});

export default i18n;