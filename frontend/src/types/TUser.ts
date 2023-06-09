import { IWhoAmI } from '@/types/IWhoAmI';

export default class User {
  public readonly last_name: string;
  public readonly first_name: string;
  public readonly username: string;
  public readonly email: string;
  public readonly drf_token: string;

  constructor(data: IWhoAmI) {
    this.last_name  = data?.data?.last_name  ?? '';
    this.first_name = data?.data?.first_name ?? '';
    this.username   = data?.username         ?? '';
    this.email      = data?.email            ?? '';
    this.drf_token  = data?.drf_token        ?? '';
  }
}
