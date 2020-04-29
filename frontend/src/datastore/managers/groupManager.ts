import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IGroupRequest, IMacroGroupsRequest, IProjectRequest} from '@/datastore/interfaces/RequestsInterfaces';


export interface IGroupManager {
    groups: (locale: string) => Promise<IGroupRequest>;
    groupsInMacrogroup: (locale: string,id: number) => Promise<IGroupRequest>;
    macrogroups: (locale: string) => Promise<IMacroGroupsRequest>;
    groupsNoMacrogroups: (locale: string) => Promise<IGroupRequest>;
    projectsInGroup: (locale: string, id: number) => Promise<IProjectRequest>;
}

export class GroupManager implements IGroupManager {

    constructor(private httpClient: IHttpClient) {
    }

    /**
     * ritorna tutto l'insieme dei gruppi
     */
    public groups(locale: string = 'en'): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>(locale + '/portal/api/group/');
    }

    /**
     * ritorna l'insieme dei gruppi contenuti in un macrogruppo7
     */
    public async groupsInMacrogroup(locale: string = 'en', id: number): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>(locale + '/portal/api/group/' + id);
    }

    /**
     * ritorna i macrogruppi
     */
    public macrogroups(locale: string = 'en'): Promise<IMacroGroupsRequest> {
        return this.httpClient.get<IMacroGroupsRequest>(locale + '/portal/api/macrogroup/');
    }

    /**
     * ritorna i gruppi che non appartengono ad un macrogruppo
     */
    public groupsNoMacrogroups(locale: string = 'en'): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>(locale + '/portal/api/group/nomacrogroup/');
    }

    /**
     * ritorna i progetti di uno specifico gruppo dato l'id
     */
    public projectsInGroup(locale: string = 'en', id: number): Promise<IProjectRequest> {
        return this.httpClient.get<IProjectRequest>(locale + '/portal/api/group/' + id + '/projects/');
    }
}

export const groupManager: GroupManager = new GroupManager(httpClient);
