import {IMacroGroup} from '@/datastore/interfaces/MacroGroupInterface';
import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';
import {Group} from '@/datastore/types/Group';
import store from '@/store';
import {SuperGroup} from '@/datastore/types/SuperGroup';
import {i18n} from '@/main';

export class MacroGroup extends SuperGroup {
  public id: number;
  public title: string;
  public description: string;
  public logo_img: string;
  public logo_link: string | null;

  constructor();
  constructor(data: IMacroGroup);
  constructor(data?: any) {
    super();
    this.id = data && data.id || -1;
    this.title = data && data.title || '';
    this.description = data && data.description || '';
    this.logo_img = data && data.logo_img || '';
    this.logo_link = data && data.logo_link || '';
  }

  get Key() {
    return EBoxType[this.InstanceOf] + '_' + this.id;
  }

  get Id() {
    return this.id;
  }

  get Title() {
    return this.title;
  }

  get Description() {
    return this.description;
  }

  get Logo() {
    return this.logo_img;
  }

  get LogoLink() {
    return this.logo_link;
  }

  // non mettere statico
  get InstanceOf() {
    return EBoxType.MG;
  }

  get Groups() {
    return store.getters['group/groupsInMacroGroup'](this.Id);
  }

  public fetchGroups() {
    store.dispatch('group/fetchGroupsByMacroGroupId', {locale: i18n.locale, id: this.Id});
  }
}


export interface IMacroGroupDict {
  [key: number]: MacroGroup;
}

export interface IGroupInMacrogroupDict {
  [key: number]: Group[];
}


