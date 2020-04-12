import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {Info} from '@/datastore/types/Info';
import {IInfo} from '@/datastore/interfaces/InfoInterface';

export interface IInfoManager {
    infodata: () => Promise<Info>;
}

export class InfoManager implements IInfoManager {

    constructor(private httpClient: IHttpClient) {
    }

    public async infodata(): Promise<Info> {
        return new Info(await this.httpClient.get<IInfo>('portal/api/infodata/'));
    }

}

export const infoManager: InfoManager = new InfoManager(httpClient);
