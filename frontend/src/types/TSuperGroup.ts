import { EBoxType } from '@/types/EBoxType';

export class SuperGroup {
  public title: string;

  constructor() {
    this.title = '';
  }

  get InstanceOf() {
    return EBoxType.SUPER;
  }
}

export interface ISuperGroupDict {
  [key: number]: SuperGroup;
}