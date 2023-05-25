import { EBoxType } from '@/types/EBoxType';
import { IMacroGroup } from '@/types/IMacroGroup';
import { SuperGroup } from '@/types/TSuperGroup';

import { useGroupStore } from '@/stores';

export class MacroGroup extends SuperGroup {
  public id: number;
  public title: string;
  public description: string;
  public logo_img: string;
  public logo_link: string | null;

  constructor(data: IMacroGroup) {
    super();
    this.id          = data && data.id || -1;
    this.title       = data && data.title || '';
    this.description = data && data.description || '';
    this.logo_img    = data && data.logo_img || '';
    this.logo_link   = data && data.logo_link || '';
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
    return useGroupStore().groupsInMacroGroup(this.Id);
  }

  public fetchGroups() {
    return useGroupStore().fetchGroupsByMacroGroupId(this.Id);
  }
}