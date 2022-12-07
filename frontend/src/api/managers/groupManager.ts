import { httpClient, IHttpClient } from '@/api/HttpClient';
import { IGroup } from '@/types/IGroup';
import { IGroupManager } from '@/types/IGroupManager';
import { IMacroGroup } from '@/types/IMacroGroup';
import { IProject } from '@/types/IProject';

export class GroupManager implements IGroupManager {

  constructor(private httpClient: IHttpClient) { }

  /**
   * Fetch all groups
   */
  public groups(locale: string = 'en'): Promise<IGroup[]> {
    return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/');
  }

  /**
   * Fetch all groups within a macrogroup
   */
  public async groupsInMacrogroup(locale: string = 'en', id: number): Promise<IGroup[]> {
    return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/' + id);
  }

  /**
   * Fetch all macrogroups
   */
  public macrogroups(locale: string = 'en'): Promise<IMacroGroup[]> {
    return this.httpClient.get<IMacroGroup[]>(locale + '/portal/api/macrogroup/');
  }

  /**
   * Fetch all groups without a parent macrogroup
   */
  public groupsNoMacrogroups(locale: string = 'en'): Promise<IGroup[]> {
    return this.httpClient.get<IGroup[]>(locale + '/portal/api/group/nomacrogroup/');
  }

  /**
   * Fetch all projects within a group
   */
  public projectsInGroup(locale: string = 'en', id: number): Promise<IProject[]> {
    return this.httpClient.get<IProject[]>(locale + '/portal/api/group/' + id + '/projects/');
  }

  /**
   * Fetch all projects
   */
  public projects(locale: string = 'en'): Promise<IProject[]> {
    return this.httpClient.get<IProject[]>(locale + '/portal/api/project/');
  }
}

export const groupManager: GroupManager = new GroupManager(httpClient);
