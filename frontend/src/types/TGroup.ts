import { EBoxType } from '@/types/EBoxType';
import { IGroup } from '@/types/IGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { useDataStore } from '@/stores';

export class Group extends SuperGroup {
  public id: number;
  public name: string;
  public description: string;
  public title: string;
  public srid: number;
  public header_logo_link: string | null;
  public header_logo_img: string;

  constructor(data: IGroup) {
    super();
    this.id               = data && data.id || -1;
    this.name             = data && data.name || '';
    this.description      = data && data.description || '';
    this.title            = data && data.title || '';
    this.srid             = data && data.srid || -1;
    this.header_logo_link = data && data.header_logo_link || '';
    this.header_logo_img  = data && data.header_logo_img || '';

    // in case of empty title try to get title from name property
    if (!this.title) {
      this.title = this.name;
    }
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
    return useDataStore().projectsInGroup(this.Id);
  }

  public fetchProjects() {
    return useDataStore().fetchProjectsByGroupId(this.Id.toString());
  }

}