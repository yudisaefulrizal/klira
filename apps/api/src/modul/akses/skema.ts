export { masuk as skemaMasuk } from '@klira/shared';
export type { PenggunaSaya } from '@klira/shared';

export const NAMA_COOKIE_SESI = 'klira_sesi';

export type AkunMasuk = {
  id: number;
  fasyankes_id: number;
  nama: string;
  username: string;
  kata_sandi_hash: string;
  aktif: boolean;
  wajib_ganti_kredensial: boolean;
};

export type AksesAkun = { jenis_akun: string[]; fitur: string[] };

export type SesiAktif = { akun: AkunMasuk };
