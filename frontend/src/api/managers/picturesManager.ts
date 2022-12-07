import { httpClient, IHttpClient } from '@/api/HttpClient';
import { IPictures } from '@/types/IPictures';
import { IPicturesManager } from '@/types/IPicturesManager';

export class PicturesManager implements IPicturesManager {

  constructor(private httpClient: IHttpClient) { }

  public pictures(locale: string = 'en'): Promise<IPictures[]> {
    return this.httpClient.get<IPictures[]>(locale + '/portal/api/pictures/');
  }
}

export const picturesManager: PicturesManager = new PicturesManager(httpClient);
