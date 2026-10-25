import { GALAT } from '@klira/shared';
import type { KonfirmasiPeringatan, PeringatanTerdeteksi } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';

export type HasilAksi<T> =
  | { jenis: 'berhasil'; data: T }
  | { jenis: 'peringatan'; peringatan: PeringatanTerdeteksi[] }
  | { jenis: 'galat'; pesan: string };

/**
 * Jalankan satu tindakan API. 409 perlu_konfirmasi_peringatan menjadi hasil `peringatan` (pimpinan mengisi alasan lalu
 * tindakan diulang dengan `konfirmasi`); galat lain menjadi pesan.
 */
export async function jalankanAksi<T>(
  kirim: (konfirmasi?: KonfirmasiPeringatan) => Promise<T>,
  konfirmasi?: KonfirmasiPeringatan,
): Promise<HasilAksi<T>> {
  try {
    return { jenis: 'berhasil', data: await kirim(konfirmasi) };
  } catch (e) {
    if (e instanceof GalatApi) {
      if (e.status === 409 && e.kode === 'perlu_konfirmasi_peringatan') return { jenis: 'peringatan', peringatan: e.peringatan ?? [] };
      return { jenis: 'galat', pesan: e.message };
    }
    return { jenis: 'galat', pesan: GALAT.umum };
  }
}
