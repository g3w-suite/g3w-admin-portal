import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';

export class SuperGroup {
  public title: string;

  constructor() {
    this.title = '';
  }

  get InstanceOf() {
    return EBoxType.SUPER;
  }
}
