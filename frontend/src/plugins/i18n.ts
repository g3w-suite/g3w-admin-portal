import * as VueI18n from 'vue-i18n';
import { en } from '@/locale/en';
import { it } from '@/locale/it';

// import { loadLanguageAsync } from '@/utils'; 

// HOTFIX for: https://github.com/intlify/vue-i18n-next/issues/1119#issuecomment-1351270253
const messages = { en, it } as VueI18n.I18nOptions['messages']

export const i18n = VueI18n.createI18n({
  locale: document.documentElement.lang || 'en',
  fallbackLocale: 'en',
  messages,
  globalInjection: true,
 
  /** @TODO https://vue-i18n.intlify.dev/guide/migration/vue3.html */
  // allowComposition: true, // 
});