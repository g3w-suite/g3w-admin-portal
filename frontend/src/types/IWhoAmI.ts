interface  IWhoAmIData {
  lastn_ame: string;
  first_name: string;
}

export interface IWhoAmI {
  is_authenticated: boolean;
  username?: string;
  data?: IWhoAmIData;
  email?: string;
}
