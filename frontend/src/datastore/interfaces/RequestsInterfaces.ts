import {IGroup} from '@/datastore/interfaces/GroupInterface';
import {IMacroGroup} from '@/datastore/interfaces/MacroGroupInterface';
import {IProject} from '@/datastore/interfaces/ProjectInterface';

// export interface IRequest {
//     count: number;
//     next: number | null;
//     previous: number | null;
// }
//
// export interface IGroupRequest extends IRequest {
//     results: IGroup[];
// }
//
// export interface IMacroGroupsRequest extends IRequest {
//     results: IMacroGroup[];
// }
//
// export interface IProjectRequest extends IRequest {
//     results: IProject[];
// }

export enum EBoxType {
    'SUPER',
    'MG',
    'G',
    'P',
}


