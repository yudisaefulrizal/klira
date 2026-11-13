import { GALAT } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { bentukPermintaan } from './keadaan-akun.js';
/**
 * Kirim pembuatan akun. 409 perlu_konfirmasi_peringatan menjadi hasil `peringatan` (pimpinan mengisi alasan lalu
 * kirim ulang dengan `konfirmasi`); galat lain menjadi pesan untuk ditampilkan.
 */
export async function kirimAkun(keadaan, konfirmasi, kirim) {
    try {
        return { jenis: 'berhasil', data: await kirim(bentukPermintaan(keadaan, konfirmasi)) };
    }
    catch (e) {
        if (e instanceof GalatApi) {
            if (e.status === 409 && e.kode === 'perlu_konfirmasi_peringatan')
                return { jenis: 'peringatan', peringatan: e.peringatan ?? [] };
            return { jenis: 'galat', pesan: e.message };
        }
        return { jenis: 'galat', pesan: GALAT.umum };
    }
}
