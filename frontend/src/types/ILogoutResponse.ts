import { ELoginStatus } from '@/types/ELoginStatus';

export interface ILogoutResponse {
  status: ELoginStatus;
  message?: string;
}
