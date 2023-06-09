import { EBoxType } from '@/types/EBoxType';
import { IGroup } from '@/types/IGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { useDataStore } from '@/stores';

export class Group extends SuperGroup {
  public readonly id: number;
  public readonly name: string;
  public readonly description: string;
  public readonly title: string;
  public readonly srid: number;
  public readonly logo_link: string | null;
  public readonly logo_img: string;

  constructor(data: IGroup, order = 0) {
    super();
    this.id               = data && data.id || -1;
    this.name             = data && data.name || '';
    this.description      = data && data.description || '';
    this.title            = data && data.title || '';
    this.srid             = data && data.srid || -1;
    this.logo_link = data && data.header_logo_link || '';
    this.logo_img  = data && data.header_logo_img || '';

    // in case of empty title try to get title from name property
    if (!this.title) {
      this.title = this.name;
    }

    this.order = parseFloat("1000." + order);
  }

  get Key() {
    return EBoxType[this.InstanceOf] + '_' + this.id;
  }

  // non mettere statico
  get InstanceOf() {
    return EBoxType.G;
  }

  get Projects() {
    return useDataStore().projectsInGroup(this.id);
  }

  public fetchProjects() {
    return useDataStore().fetchProjectsByGroupId(this.id.toString());
  }

}