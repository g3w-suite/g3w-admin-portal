import i18n from '@/i18n';
import { useLangStore } from '@/stores';

const loadedLanguages = ['en']; // our default language that is preloaded

function setI18nLanguage (lang: 'en' | 'it') {
  // axios.defaults.headers.common['Accept-Language'] = lang
  document.documentElement.lang = i18n.global.locale = lang
  useLangStore().switchLang(lang);
  return lang;
}

export default async function loadLanguageAsync(lang: string) {
  // If the language hasn't been loaded yet
  if (i18n.global.locale !== lang && !loadedLanguages.includes(lang)) {
    i18n.global.setLocaleMessage(lang, (await import(`@/locale/${lang}.ts`)).default);
    loadedLanguages.push(lang);
  }
  return Promise.resolve(setI18nLanguage(lang))
}