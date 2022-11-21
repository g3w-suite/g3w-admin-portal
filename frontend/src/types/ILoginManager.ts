import { ILoginResponse } from '@/types/ILoginResponse';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IWhoAmI } from '@/types/IWhoAmI';

export interface ILoginManager {
  login: (locale: string, username: string, password: string) => Promise<ILoginResponse>;
  logout: (locale: string)                                     => Promise<ILogoutResponse>;
  who_am_i: (locale: string)                                     => Promise<IWhoAmI>;
}
