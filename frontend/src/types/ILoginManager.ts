import { ILoginResponse } from '@/types/ILoginResponse';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IWhoAmI } from '@/types/IWhoAmI';

export interface ILoginManager {
  login: (locale: string, username: string, password: string) => Promise<ILoginResponse>;
  logout: (locale: string, token?: string | null)             => Promise<ILogoutResponse>;
  who_am_i: (locale: string)                                  => Promise<IWhoAmI>;
}
