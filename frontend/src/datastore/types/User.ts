import {WhoAmIInterface} from '@/datastore/interfaces/WhoAmIInterface';

export default class User {
  private readonly lastn_ame: string;
  private readonly first_name: string;
  private readonly username: string;
  private readonly email: string;

  constructor();
  constructor(data: WhoAmIInterface);
  constructor(data?: any) {
    this.lastn_ame = data && data.data.lastn_ame;
    this.first_name = data && data.data.first_name;
    this.username = data && data.username;
    this.email = data && data.email;
  }
}
