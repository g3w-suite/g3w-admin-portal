import { httpClient, IHttpClient } from '@/api/HttpClient';
import { IInfo } from '@/types/IInfo';
import { IInfoManager } from '@/types/IInfoManager';
import { Info } from '@/types/TInfo';

export class InfoManager implements IInfoManager {

  constructor(private httpClient: IHttpClient) {}

  /**
   * Fetch server metadata
   */
  public async infodata(locale: string = 'en'): Promise<Info> {
    return new Info(await this.httpClient.get<IInfo>(locale + '/portal/api/infodata/'));
  }

}

export const infoManager: InfoManager = new InfoManager(httpClient);
