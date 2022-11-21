import { IGroupDict } from '@/types/TGroup';
import { IGroupInMacrogroupDict, IMacroGroupDict } from '@/types/TMacroGroup';
import { IProgectInGroupDict, Project } from '@/types/TProject';
import { SuperGroup } from '@/types/TSuperGroup';

export interface IGroupState {
  MacroGroups: IMacroGroupDict;
  GroupsWithNoMacroGroup: IGroupDict;
  Groups: IGroupDict;
  GroupsInMacroGroups: IGroupInMacrogroupDict;
  ProjectsInGroups: IProgectInGroupDict;
  Projects: Project[];
  ActiveGroup: SuperGroup | null;
  Search: string;
}
