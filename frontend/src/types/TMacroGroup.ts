import { EBoxType } from '@/types/EBoxType';
import { IMacroGroup } from '@/types/IMacroGroup';
import { SuperGroup } from '@/types/TSuperGroup';

import { useDataStore } from '@/stores';

export class MacroGroup extends SuperGroup {
  public readonly id: number;
  public readonly title: string;
  public readonly description: string;
  public readonly logo_img: string;
  public readonly logo_link: string | null;

  constructor(data: IMacroGroup, order = 0) {
    super();
    this.id          = data?.id          ?? -1;
    this.title       = data?.title       ?? '';
    this.description = data?.description ?? '';
    this.logo_img    = data?.logo_img    ?? '';
    this.logo_link   = data?.logo_link   ?? '';
    this.order       = parseFloat("200." + order);
  }

  get Key() {
    return EBoxType[this.InstanceOf] + '_' + this.id;
  }

  // non mettere statico
  get InstanceOf() {
    return EBoxType.MG;
  }

  get Groups() {
    return useDataStore().groupsInMacroGroup(this.id);
  }

  public fetchGroups() {
    return useDataStore().fetchGroupsByMacroGroupId(this.id.toString());
  }
}