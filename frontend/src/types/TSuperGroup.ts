import { EBoxType } from '@/types/EBoxType';

export class SuperGroup {

  public title: string;
  public order: number;

  /**
   * Random key to be used within v-for loops
   */
  public _vue_uid: string = Date.now().toString(36) + Math.random().toString(36).substr(2);

  constructor() {
    this.title = '';
    this.order = 0;
  }

  get InstanceOf() {
    return EBoxType.SUPER;
  }
}
