import type { InfoStatus, WarnaStatus } from '@klira/shared';
import { warna } from './token';

/** Memetakan nama token warna status (dari @klira/shared) ke nilai tampilan. */
export function gayaStatus(info: InfoStatus | WarnaStatus) {
  const nama = typeof info === 'string' ? info : info.warna;
  return warna.status[nama];
}
