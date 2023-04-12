import { EBoxType } from '@/types/EBoxType';

export class SuperGroup {

  public title: string;

  /**
   * Random key to be used within v-for loops 
   */
  public _vue_uid: string = Date.now().toString(36) + Math.random().toString(36).substr(2);

  constructor() {
    this.title = '';
  }

  get InstanceOf() {
    return EBoxType.SUPER;
  }
}
