import { defineStore } from 'pinia'

export const useModal = defineStore('modal', {

  state: () => ({
    img_link: '',
    title: '',
  }),

  getters: {
    url:   (state): string => state.img_link,
    title: (state): string => state.title,
  },

  actions: {

    setUrl(url: string) {
      this.img_link = url;
    },
  
    setTitle(title: string) {
      this.title = title;
    },

    reset() {
      this.img_link = '';
      this.title = '';
    },

  }

});