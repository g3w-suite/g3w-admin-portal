import { i18n } from '@/plugins';
import { useDataStore, useAuthStore } from '@/stores';
import { defineStore } from 'pinia'

type lang_code = 'en' | 'it';

interface IRootState {
  isLoading: boolean;
  // hasMenu: boolean;
  portalSections: string[];
  showAdminButton: boolean;
  locale: string;
  loadedLanguages: string[];
}

/**
 * @FIXME why do we need this?
 *
 * Used to set first time application ready
 */
let ready: boolean = false;

export const useRootStore = defineStore('root', {

  state: (): IRootState => ({
    isLoading: false,
    // hasMenu: false,
    portalSections: [],
    showAdminButton: false,
    locale: 'en',
    loadedLanguages: ['en'] // our default language that is preloaded
  }),

  actions: {

    showLoader() {
      this.isLoading = true;
    },

    hideLoader() {
      this.isLoading = false;
    },

    async setupPage(to, from) {
      const { lang } = to.params;

      console.log(lang);

      // update html lang attribute
      await this.loadLanguageAsync(lang);

      // listen for language change
      if (!ready || i18n.global.locale !== lang) {
        await this.fetchData();
      }

      ready = true; // false = first time

      // update body css class name
      if (to.name) { document.body.classList.add(to.name as string); }
      if (from.name && from.name !== to.name) { document.body.classList.remove(from.name as string); }

      // update 'group/ActiveGroup' getter
      await useDataStore().setActiveGroup();
    },

    /**
     * Fetch general application data
     */
    async fetchData(refresh = false) {
      // disgread JWT tokens after calling: commit('setUser', null)
      if (!useAuthStore().useCookies && !useAuthStore().user) {
        await useAuthStore().removeTokens();
      }
      if (refresh) {
        await useDataStore().reset();
        await useDataStore().setActiveGroup();
      }
      this.showLoader();
      await Promise.allSettled([
        useDataStore().fetchInfo(),
        useDataStore().fetchPictures(),
        useDataStore().fetchMacroGroups(),
        useDataStore().fetchGroupsWithNoMacroGroup(),
        useDataStore().fetchProjects(),
      ]);
      this.hideLoader();
    },

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

    // toggleMenu() {
    //   this.hasMenu = !this.hasMenu;
    // },

    // openModal({ title: string, content: string }) {
    //  const dialog = document.querySelector('dialog');
    //  dialog.innerHTML = title + '<br>' + content;
    //  dialog.showModal();
    // },

    // closeModal() {
    //  const dialog = document.querySelector('dialog');
    // dialog.close();
    // },

  }

});