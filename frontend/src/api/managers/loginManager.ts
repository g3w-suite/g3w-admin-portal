import { httpClient, IHttpClient } from '@/api/HttpClient';
import { ILoginManager } from '@/types/ILoginManager';
import { ILoginResponse } from '@/types/ILoginResponse';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IWhoAmI } from '@/types/IWhoAmI';
import * as qs from 'qs';

export class LoginManager implements ILoginManager {

  constructor(private httpClient: IHttpClient) { }

  /**
   * Fetch user status (logged in/out)
   */
  public who_am_i(locale: string = 'en'): Promise<IWhoAmI> {
    return this.httpClient.get<IWhoAmI>(locale + '/portal/api/whoami/');
  }

  /**
   * Perform login request
   */
  public login(locale: string, username: string, password: string): Promise<ILoginResponse> {
    return this.httpClient.post<ILoginResponse>(locale + '/jx/login/', qs.stringify({username, password}), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Perform logout request
   */
  public logout(locale: string = 'en'): Promise<ILogoutResponse> {
    return this.httpClient.get<ILogoutResponse>(locale + '/jx/logout/');
  }

}

export const loginManager: LoginManager = new LoginManager(httpClient);
