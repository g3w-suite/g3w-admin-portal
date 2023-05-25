import { IPictures } from '@/types/IPictures';
import { get_from_portal } from '@/utils';

import { defineStore } from 'pinia'

interface ISettings {
  portalSections: string[];
  showAdminButton: boolean;
  pictures: IPictures[];
}

export const useSettingsStore = defineStore('settings', {

  state: (): ISettings => ({
    portalSections: [],
    showAdminButton: false,
    pictures: [],
  }),

  actions: {

    async fetchPictures() {
      this.pictures = (await get_from_portal<IPictures[]>('/api/pictures/'))
        .sort((a: IPictures, b: IPictures) => {
          if (a.order < b.order) { return -1; }
          if (a.order > b.order) { return 1; }
          return 0;
        });
    },

  }

});