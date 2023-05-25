import { jwtManager } from '@/api/managers/jwtManager';
import { loginManager as sessionManager } from '@/api/managers/loginManager';
import { ILoginManager } from '@/types/ILoginManager';

import { useRootStore } from '@/stores';

/**
 * Factory login manager (Cookie sessions vs JWT Auth).
 */
export default function loginManager(): ILoginManager {
  return useRootStore().useCookies ? sessionManager : jwtManager;
}
