import { Info } from '@/types/TInfo';

export interface IInfoManager {
  infodata: (locale: string) => Promise<Info>;
}
