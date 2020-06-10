import {httpClient, IHttpClient} from '@/datastore/HttpClient';
import {IGroup} from "@/datastore/interfaces/GroupInterface";
import {IProject} from "@/datastore/interfaces/ProjectInterface";
import {IMacroGroup} from "@/datastore/interfaces/MacroGroupInterface";


export interface IGroupManager {
    groups: (locale: string) => Promise<IGroup[]>;
    groupsInMacrogroup: (locale: string,id: number) => Promise<IGroup[]>;
    macrogroups: (locale: string) => Promise<IMacroGroup[]>;
    groupsNoMacrogroups: (locale: string) => Promise<IGroup[]>;
    projectsInGroup: (locale: string, id: number) => Promise<IProject[]>;
    projects:(locale: string)=> Promise<IProject[]>;
}

export class GroupManager implements IGroupManager {

    constructor(private httpClient: IHttpClient) {
    }

    /**
     * ritorna tutto l'insieme dei gruppi
     */
    public groups(locale: string = 'en'): Promise<IGroup[]> {
        return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/');
    }

    /**
     * ritorna l'insieme dei gruppi contenuti in un macrogruppo7
     */
    public async groupsInMacrogroup(locale: string = 'en', id: number): Promise<IGroup[]> {
        return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/' + id);
    }

    /**
     * ritorna i macrogruppi
     */
    public macrogroups(locale: string = 'en'): Promise<IMacroGroup[]> {
        return this.httpClient.get<IMacroGroup[]>(locale + '/portal/api/macrogroup/');
    }

    /**
     * ritorna i gruppi che non appartengono ad un macrogruppo
     */
    public groupsNoMacrogroups(locale: string = 'en'): Promise<IGroup[]> {
        return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/nomacrogroup/');
    }

    /**
     * ritorna i progetti di uno specifico gruppo dato l'id
     */
    public projectsInGroup(locale: string = 'en', id: number): Promise<IProject[]> {
        return this.httpClient.get<IProject[]>(locale + '/portal/api/group/' + id + '/projects/');
    }

    /**
     * ritorna tutti i progetti
     */
    public projects(locale: string = 'en'): Promise<IProject[]> {
        return this.httpClient.get<IProject[]>(locale + '/portal/api/project/');
    }
}

export const groupManager: GroupManager = new GroupManager(httpClient);
