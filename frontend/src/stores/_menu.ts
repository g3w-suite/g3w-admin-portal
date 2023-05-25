import { defineStore } from 'pinia'

export const useMenu = defineStore('menu', {

  state: () => ({
    visibility: false
  }),

  getters: {
    isVisible: (state): boolean => state.visibility,
  },

  actions: {

    setVisibility(v:boolean) {
      this.visibility = v;
    },

    toggleVisibility() {
      this.toggle();
    },

    toggle() {
      this.visibility = !this.visibility;
    },

  }

});