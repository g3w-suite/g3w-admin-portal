import { EBoxType } from '@/types/EBoxType';
import { IProject } from '@/types/IProject';
import { SuperGroup } from '@/types/TSuperGroup';

export class Project extends SuperGroup {
  public readonly id: number;
  public readonly title: string;
  public readonly description: string;
  public readonly thumbnail: string;
  public readonly edit_url: string;
  public readonly map_url: string;
  public readonly logo_img: string;
  public readonly logo_link: string | null;

  constructor(data: IProject) {
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

  // non mettere statico
  get InstanceOf() {
    return EBoxType.P;
  }

}