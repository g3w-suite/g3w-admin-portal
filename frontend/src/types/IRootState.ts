export interface IRootState {
  showLoader: boolean;
  errors: string[];
  crossOrigin: boolean;
  access_token: string | null;
  refresh_token: string | null;
  useCookies: boolean;
}
