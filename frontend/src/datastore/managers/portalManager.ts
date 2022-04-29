import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IPictures} from '@/datastore/interfaces/PortalInterface';

export interface IPortalManager {
  pictures: (locale: string) => Promise<IPictures[]>;
}

export class PortalManager implements IPortalManager {

  constructor(private httpClient: IHttpClient) {
  }

  public pictures(locale: string = 'en'): Promise<IPictures[]> {
    return this.httpClient.get<IPictures[]>(locale + '/portal/api/pictures/');
  }
}

export const portalManager: PortalManager = new PortalManager(httpClient);
