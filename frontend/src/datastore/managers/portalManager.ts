import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IPicturesPagination} from "@/datastore/interfaces/PortalInterface";

export interface IPortalManager {
    pictures: (locale: string) => Promise<IPicturesPagination>;
}

export class PortalManager implements IPortalManager {

    constructor(private httpClient: IHttpClient) {
    }

    public pictures(locale: string = 'en'): Promise<IPicturesPagination> {
        return this.httpClient.get<IPicturesPagination>('http://localhost:8000/portal/api/pictures/');
    }
}

export const portalManager: PortalManager = new PortalManager(httpClient);
