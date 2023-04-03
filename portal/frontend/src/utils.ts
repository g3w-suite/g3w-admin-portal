import { jwtManager} from '@/api/managers/jwtManager';
import { loginManager as sessionManager } from '@/api/managers/loginManager';
import { ILoginManager } from '@/types/ILoginManager';
import { IRootState } from '@/types/IRootState';

/**
 * Check for cross origin URLs.
 */
export function sameOrigin(a: string, b: string): boolean {
    return (new URL(a)).origin === (new URL(b)).origin;
}

/**
 * Factory login manager (Cookie sessions vs JWT Auth).
 */
export function loginManager(state: IRootState): ILoginManager {
    return state.crossOrigin ? jwtManager : sessionManager;
}
