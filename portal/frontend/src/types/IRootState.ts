export interface IRootState {
  showLoader: boolean;
  errors: string[];
  authUser: object;
  isAuthenticated: boolean;
  endpoints: {
    obtainJWT: string;
    refreshJWT: string;
    heartbeat: string;
    // baseUrl: string;
  };
  crossOrigin: boolean;
  access_token: string | null;
  refresh_token: string | null;
}
