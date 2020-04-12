import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IGroupRequest, IMacroGroupsRequest, IProjectRequest} from '@/datastore/interfaces/RequestsInterfaces';


export interface IGroupManager {
    groups: () => Promise<IGroupRequest>;
    groupsInMacrogroup: (id: number) => Promise<IGroupRequest>;
    macrogroups: () => Promise<IMacroGroupsRequest>;
    groupsNoMacrogroups: () => Promise<IGroupRequest>;
    projectsInGroup: (id: number) => Promise<IProjectRequest>;
}

export class GroupManager implements IGroupManager {

    constructor(private httpClient: IHttpClient) {
    }

    /**
     * ritorna tutto l'insieme dei gruppi
     */
    public groups(): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>('portal/api/group/');
    }

    /**
     * ritorna l'insieme dei gruppi contenuti in un macrogruppo
     * @param id
     */
    public async groupsInMacrogroup(id: number): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>('portal/api/group/' + id);
    }

    /**
     * ritorna i macrogruppi
     */
    public macrogroups(): Promise<IMacroGroupsRequest> {
        return this.httpClient.get<IMacroGroupsRequest>('portal/api/macrogroup/');
    }

    /**
     * ritorna i gruppi che non appartengono ad un macrogruppo
     */
    public groupsNoMacrogroups(): Promise<IGroupRequest> {
        return this.httpClient.get<IGroupRequest>('portal/api/group/nomacrogroup/');
    }

    /**
     * ritorna i progetti di uno specifico gruppo dato l'id
     */
    public projectsInGroup(id: number): Promise<IProjectRequest> {
        return this.httpClient.get<IProjectRequest>('portal/api/group/' + id + '/projects/');
    }
}

export const groupManager: GroupManager = new GroupManager(httpClient);
