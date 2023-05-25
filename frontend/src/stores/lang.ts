import { defineStore } from 'pinia'

export const useLangStore = defineStore('lang', {

  state: () => ({
    locale: 'en'
  }),

  actions: {

    switchLang(locale: string) {
      this.locale = locale;
    }

  }

})