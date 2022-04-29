import {IGroup} from '@/datastore/interfaces/GroupInterface';
import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';
import {SuperGroup} from '@/datastore/types/SuperGroup';
import store from '@/store';
import {i18n} from '@/main';

export class Group extends SuperGroup {
  public id: number;
  public name: string;
  public description: string;
  public title: string;
  public srid: number;
  public header_logo_link: string | null;
  public header_logo_img: string;

  constructor();
  constructor(data: IGroup);
  constructor(data?: any) {
    super();
    this.id = data && data.id || -1;
    this.name = data && data.name || '';
    this.description = data && data.description || '';
    this.title = data && data.title || '';
    this.srid = data && data.srid || -1;
    this.header_logo_link = data && data.header_logo_link || '';
    this.header_logo_img = data && data.header_logo_img || '';
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
    return this.header_logo_img;
  }

  get LogoLink() {
    return this.header_logo_link;
  }

  // non mettere statico
  get InstanceOf() {
    return EBoxType.G;
  }

  get Projects() {
    return store.getters['group/projectsInGroup'](this.Id);
  }

  public fetchProjects() {
    store.dispatch('group/fetchProjectsByGroupId', {locale: i18n.locale, id: this.Id});
  }

}

export interface IGroupDict {
  [key: number]: Group;
}
