interface  WhoAmIDataInterface {
  lastn_ame: string;
  first_name: string;
}

export interface WhoAmIInterface {
  is_authenticated: boolean;
  username?: string;
  data?: WhoAmIDataInterface;
  email?: string;
}
