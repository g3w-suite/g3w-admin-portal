import { ELoginStatus } from '@/types/ELoginStatus';

export interface ILoginResponse {
  status: ELoginStatus;
  error_form?: object;
  message?: string;
}
