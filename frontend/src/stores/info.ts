import { get_from_portal } from '@/utils';
import { Info } from '@/types/TInfo';
import { IInfo } from '@/types/IInfo';

import { defineStore } from 'pinia'

export const useInfoStore = defineStore('info', {

  state: () => ({
    info: new Info()
  }),

  actions: {

    async fetchInfo() {
      this.info = new Info(await get_from_portal<IInfo>('/api/infodata/'));
    }

  }

})