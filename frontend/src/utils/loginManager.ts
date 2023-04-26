import { jwtManager } from '@/api/managers/jwtManager';
import { loginManager as sessionManager } from '@/api/managers/loginManager';
import { ILoginManager } from '@/types/ILoginManager';
import { IRootState } from '@/types/IRootState';

/**
 * Factory login manager (Cookie sessions vs JWT Auth).
 */
export default function loginManager(state: IRootState): ILoginManager {
  return state.useCookies ? sessionManager : jwtManager;
}
