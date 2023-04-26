import { httpClient as HTTPCLIENT, IHttpClient } from '@/api/HttpClient';
import { ILoginManager } from '@/types/ILoginManager';
import { ILoginResponse } from '@/types/ILoginResponse';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IWhoAmI } from '@/types/IWhoAmI';

export class JWTManager implements ILoginManager {

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
    return this.httpClient.post<ILoginResponse>('/authjwt/api/token/', { username, password });
  }

  /**
   * Perform logout request
   */
  public logout(locale: string = 'en', token?: string | null): Promise<ILogoutResponse> {
    return this.httpClient.post<ILogoutResponse>('/authjwt/api/token/blacklist/', { refresh: token });
  }

  /**
   * Refresh an expired "access" token
   */
  public refresh(token: string) {
    return this.httpClient.post<{ access: string }>('/authjwt/api/token/refresh/', { refresh: token });
  }

  /**
   * Heartbeat request (PING -> PONG)
   */
  public ping() {
    return this.httpClient.get<{ id: 'PONG' }>('/authjwt/api/ping/', { params: { id: 'PONG' } });
  }

}

export const jwtManager: JWTManager = new JWTManager(HTTPCLIENT);
