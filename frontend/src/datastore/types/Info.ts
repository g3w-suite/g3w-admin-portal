import {IInfo} from '@/datastore/interfaces/InfoInterface';

export class Info {
    public readonly id: string;
    public readonly title: string;
    public readonly sub_title: string;
    public readonly home_description: string;
    public readonly about_title: string;
    public readonly about_description: string;
    public readonly about_name: string;
    public readonly about_tel: string;
    public readonly about_email: string;
    public readonly about_address: string;
    public readonly groups_title: string;
    public readonly groups_map_description: string;
    public readonly login_description: string;
    public readonly suite_logo: string;
    public readonly url_suite_logo: string;
    public readonly credits: string;
    public readonly main_map_title: string;
    public readonly facebook_url: string;
    public readonly twitter_url: string;
    public readonly googleplus_url: string;
    public readonly youtube_url: string;
    public readonly instagram_url: string;
    public readonly flickr_url: string;
    public readonly tripadvisor_url: string;

    constructor();
    constructor(data: IInfo);
    constructor(data?: any) {
        this.id = data && data.id || -1;
        this.title = data && data.title || '';
        this.sub_title = data && data.sub_title || '';
        this.home_description = data && data.home_description || '';
        this.about_title = data && data.about_title || '';
        this.about_description = data && data.about_description || '';
        this.about_name = data && data.about_name || '';
        this.about_tel = data && data.about_tel || '';
        this.about_email = data && data.about_email || '';
        this.about_address = data && data.about_address || '';
        this.groups_title = data && data.groups_title || '';
        this.groups_map_description = data && data.groups_map_description || '';
        this.login_description = data && data.login_description || '';
        this.suite_logo = data && data.suite_logo || '';
        this.url_suite_logo = data && data.url_suite_logo || '#';
        this.credits = data && data.credits || '';
        this.main_map_title = data && data.main_map_title || '';
        this.facebook_url = data && data.facebook_url || '';
        this.twitter_url = data && data.twitter_url || '';
        this.googleplus_url = data && data.googleplus_url || '';
        this.youtube_url = data && data.youtube_url || '';
        this.instagram_url = data && data.instagram_url || '';
        this.flickr_url = data && data.flickr_url || '';
        this.tripadvisor_url = data && data.tripadvisor_url || '';
    }
}
