import i18n from '@/i18n';
import { defineStore } from 'pinia'

type lang_code = 'en' | 'it';

export const useLangStore = defineStore('lang', {

  state: () => ({
    locale: 'en',
    loadedLanguages: ['en'] // our default language that is preloaded
  }),

  actions: {

    switchLang(lang: lang_code) {
      // axios.defaults.headers.common['Accept-Language'] = lang
      document.documentElement.lang = i18n.global.locale = lang
      this.locale = lang;
      return lang;
    },

    async loadLanguageAsync(lang: lang_code) {
      // If the language hasn't been loaded yet
      if (i18n.global.locale !== lang && !this.loadedLanguages.includes(lang)) {
        i18n.global.setLocaleMessage(lang, (await import(`@/locale/${lang}.ts`)).default);
        this.loadedLanguages.push(lang);
      }
      return Promise.resolve(this.switchLang(lang))
    },

  }

})