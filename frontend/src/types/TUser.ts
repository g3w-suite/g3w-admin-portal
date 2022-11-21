import { IWhoAmI } from '@/types/IWhoAmI';

export default class User {
  private readonly lastn_ame: string;
  private readonly first_name: string;
  private readonly username: string;
  private readonly email: string;

  constructor();
  constructor(data: IWhoAmI);
  constructor(data?: any) {
    this.lastn_ame  = data && data.lastn_ame;
    this.first_name = data && data.first_name;
    this.username   = data && data.username;
    this.email      = data && data.email;
  }
}
