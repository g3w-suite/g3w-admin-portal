import { IInfo } from '@/types/IInfo';

export class Info {
  public readonly id: number | string;
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
  public readonly login_title: string;
  public readonly login_url: string;
  public readonly social_auth_providers: { [key:string]: string };
  public readonly logout_url: string;
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
  public readonly reset_password_url: string;

  /**
   * @TODO add the following in "g3w-admin" REST API
   */
  public readonly suite_org_url: string      = process.env.VUE_APP_SUITE_ORG_URL      || (window as any).PORTAL_ORG_URL;
  public readonly suite_org_name: string     = process.env.VUE_APP_SUITE_ORG_NAME     || (window as any).PORTAL_ORG_NAME;
  public readonly suite_org_title: string    = process.env.VUE_APP_SUITE_ORG_TITLE    || (window as any).PORTAL_ORG_TITLE;
  public readonly suite_org_image: string     = process.env.VUE_APP_SUITE_ORG_IMAGE   || (window as any).PORTAL_ORG_IMAGE;
  public readonly cookie_policy_url: string  = process.env.VUE_APP_COOKIE_POLICY_URL  || '';
  public readonly privacy_policy_url: string = process.env.VUE_APP_PRIVACY_POLICY_URL || '';
  public readonly credits_url: string        = process.env.VUE_APP_CREDITS_URL        || '';

  constructor(data?: IInfo) {
    this.id                     = data?.id                     ?? -1;
    this.title                  = data?.title                  ?? '';
    this.sub_title              = data?.sub_title              ?? '';
    this.home_description       = data?.home_description       ?? '';
    this.about_title            = data?.about_title            ?? '';
    this.about_description      = data?.about_description      ?? '';
    this.about_name             = data?.about_name             ?? '';
    this.about_tel              = data?.about_tel              ?? '';
    this.about_email            = data?.about_email            ?? '';
    this.about_address          = data?.about_address          ?? '';
    this.groups_title           = data?.groups_title           ?? '';
    this.groups_map_description = data?.groups_map_description ?? '';
    this.login_description      = data?.login_description      ?? '';
    this.login_title            = data?.login_title            ?? '';
    this.login_url              = data?.login_url              ?? '';
    this.logout_url             = data?.logout_url             ?? '';
    this.social_auth_providers  = data?.social_auth_providers  ?? {};
    this.suite_logo             = data?.suite_logo             ?? '';
    this.url_suite_logo         = data?.url_suite_logo         ?? '';
    this.credits                = data?.credits                ?? '';
    this.main_map_title         = data?.main_map_title         ?? '';
    this.facebook_url           = data?.facebook_url           ?? '';
    this.twitter_url            = data?.twitter_url            ?? '';
    this.googleplus_url         = data?.googleplus_url         ?? '';
    this.youtube_url            = data?.youtube_url            ?? '';
    this.instagram_url          = data?.instagram_url          ?? '';
    this.flickr_url             = data?.flickr_url             ?? '';
    this.tripadvisor_url        = data?.tripadvisor_url        ?? '';
    this.reset_password_url     = data?.reset_password_url     ?? '';

    // prevent using folder as img url
    if (this.suite_logo.endsWith('/')) {
      this.suite_logo = '';
    }

  }
}
