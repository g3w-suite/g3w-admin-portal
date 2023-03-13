import { IPictures } from '@/types/IPictures';

export interface IPicturesManager {
  pictures: (locale: string) => Promise<IPictures[]>;
}
