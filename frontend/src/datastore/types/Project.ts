import {IProject} from '@/datastore/interfaces/ProjectInterface';
import {SuperGroup} from '@/datastore/types/SuperGroup';
import {Group} from '@/datastore/types/Group';
import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';

export class Project extends SuperGroup {
    public id: number;
    public title: string;
    public description: string;
    public thumbnail: string;
    public edit_url: string;
    public map_url: string;
    public logo_img: string;
    public logo_link: string | null;

    constructor();
    constructor(data: IProject);
    constructor(data?: any) {
        super();
        this.id = data && data.id || -1;
        this.title = data && data.title || '';
        this.description = data && data.description || '';
        this.thumbnail = data && data.thumbnail || '';
        this.edit_url = data && data.edit_url || '';
        this.map_url = data && data.map_url || '';

        this.logo_img = this.thumbnail;
        this.logo_link = this.map_url;
    }

    get Key() {
        return EBoxType[this.InstanceOf] + '_' + this.id;
    }

    get Id() {
        return this.id;
    }

    get Title() {
        return this.title;
    }

    get Description() {
        return this.description;
    }

    get Logo() {
        return this.logo_img;
    }

    get LogoLink() {
        return this.logo_link;
    }

    // non mettere statico
    get InstanceOf() {
        return EBoxType.P;
    }

}

export interface IProgectInGroupDict {
    [key: number]: Project[];
}

