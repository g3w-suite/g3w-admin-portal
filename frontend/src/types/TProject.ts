import { EBoxType } from '@/types/EBoxType';
import { IProject } from '@/types/IProject';
import { Group } from '@/types/TGroup';
import { SuperGroup } from '@/types/TSuperGroup';

export class Project extends SuperGroup {
  public id: number;
  public title: string;
  public description: string;
  public thumbnail: string;
  public edit_url: string;
  public map_url: string;
  public logo_img: string;
  public logo_link: string | null;

  constructor();
  constructor(data: IProject);
  constructor(data?: any) {
    super();
    this.id          = data && data.id || -1;
    this.title       = data && data.title || '';
    this.description = data && data.description || '';
    this.thumbnail   = data && data.thumbnail || '';
    this.edit_url    = data && data.edit_url || '';
    this.map_url     = data && data.map_url || '';

    this.logo_img    = this.thumbnail;
    this.logo_link   = this.map_url;

    // prevent using folder as img url
    if (this.logo_img.endsWith('/')) {
      this.logo_img = 'https://via.placeholder.com/80x60';
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
    return this.logo_img;
  }

  get LogoLink() {
    return this.logo_link;
  }

  // non mettere statico
  get InstanceOf() {
    return EBoxType.P;
  }

}

export interface IProgectInGroupDict {
  [key: number]: Project[];
}
