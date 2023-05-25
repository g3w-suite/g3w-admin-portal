export interface IWhoAmI {
  is_authenticated: boolean;
  username?: string;
  data?: {
    last_name: string;
    first_name: string;
  };
  email?: string;
  drf_token?: string;
}
