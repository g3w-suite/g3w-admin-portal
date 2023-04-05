export interface IRootState {
  showLoader: boolean;
  errors: string[];
  crossOrigin: boolean;
  access_token: string;
  refresh_token: string;
  useCookies: boolean;
}
