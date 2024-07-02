import { EBoxType } from '@/types/EBoxType';

export class SuperGroup {

  public title: string;
  public order: string;

  /**
   * Random key to be used within v-for loops
   */
  public readonly _vue_uid: string = Date.now().toString(36) + Math.random().toString(36).substr(2);

  constructor() {
    this.title = '';
    this.order = '';
  }

  get InstanceOf() {
    return EBoxType.SUPER;
  }
}
