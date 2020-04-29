import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {Info} from '@/datastore/types/Info';
import {IInfo} from '@/datastore/interfaces/InfoInterface';

export interface IInfoManager {
    infodata: (locale: string) => Promise<Info>;
}

export class InfoManager implements IInfoManager {

    constructor(private httpClient: IHttpClient) {
    }

    public async infodata(locale: string = 'en'): Promise<Info> {
        return new Info(await this.httpClient.get<IInfo>(locale + '/portal/api/infodata/'));
    }

}

export const infoManager: InfoManager = new InfoManager(httpClient);
