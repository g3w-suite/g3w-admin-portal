import { IWhoAmI } from '@/types/IWhoAmI';

export default class User {
  private readonly last_name: string;
  private readonly first_name: string;
  private readonly username: string;
  private readonly email: string;
  private readonly drf_token: string;

  constructor(data: IWhoAmI) {
    this.last_name  = data && data.data && data.data.last_name || '';
    this.first_name = data && data.data && data.data.first_name || '';
    this.username   = data && data.username || '';
    this.email      = data && data.email || '';
    this.drf_token  = data && data.drf_token || '';
  }
}
