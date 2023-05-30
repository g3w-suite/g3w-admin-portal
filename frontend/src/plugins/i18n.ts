import * as VueI18n from 'vue-i18n';
import { en } from '@/locale/en';
import { it } from '@/locale/it';

// import { loadLanguageAsync } from '@/utils'; 

export const i18n = VueI18n.createI18n({
  locale: document.documentElement.lang || 'en',
  fallbackLocale: 'en',
  messages: { en, it },
  globalInjection: true,
 
  /** @TODO https://vue-i18n.intlify.dev/guide/migration/vue3.html */
  // allowComposition: true, // 
});