import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IGroupRequest, IMacroGroupsRequest, IProjectRequest} from '@/datastore/interfaces/RequestsInterfaces';
import {ILoginResponse, ILogoutResponse} from '@/datastore/interfaces/LoginInterfaces';
import * as qs from 'qs';
import {WhoAmIInterface} from '@/datastore/interfaces/WhoAmIInterface';

export interface ILoginManager {
    login: (locale: string, username: string, password: string) => Promise<ILoginResponse>;
    logout: (locale: string) => Promise<ILogoutResponse>;
    who_am_i: () => Promise<WhoAmIInterface>;
}

export class LoginManager implements ILoginManager {

    constructor(private httpClient: IHttpClient) {
    }

    public login(locale: string, username: string, password: string): Promise<ILoginResponse> {
        return this.httpClient.post<ILoginResponse>(locale + '/jx/login/', qs.stringify({username, password}), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }

    public who_am_i(): Promise<WhoAmIInterface> {
        return this.httpClient.get<WhoAmIInterface>('/portal/api/whoami/');
    }

    public logout(locale: string): Promise<ILogoutResponse> {
        return this.httpClient.get<ILogoutResponse>(locale + '/jx/logout/');
    }
}

export const loginManager: LoginManager = new LoginManager(httpClient);
