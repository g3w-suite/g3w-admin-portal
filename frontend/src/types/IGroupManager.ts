import { IGroup } from '@/types/IGroup';
import { IMacroGroup } from '@/types/IMacroGroup';
import { IProject } from '@/types/IProject';

export interface IGroupManager {
  groups: (locale: string)             => Promise<IGroup[]>;
  groupsInMacrogroup: (locale: string, id: number) => Promise<IGroup[]>;
  macrogroups: (locale: string)             => Promise<IMacroGroup[]>;
  groupsNoMacrogroups: (locale: string)             => Promise<IGroup[]>;
  projectsInGroup: (locale: string, id: number) => Promise<IProject[]>;
  projects: (locale: string)             => Promise<IProject[]>;
}
