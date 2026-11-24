import { Transform } from 'node:stream';
import { finished } from 'node:stream/promises';
import { GalatCadangan, catatSetelahGantiData, mulaiUnduhBackup, pulihkanBackup, resetSistem } from '@klira/db';
export { GalatCadangan };
/** Unggahan cadangan lewat web dibatasi; cadangan yang lebih besar dipulihkan operator lewat perintah di server. */
export const BATAS_UNGGAH_CADANGAN = 512 * 1024 * 1024;
/** Pemulihan dan reset lewat web mati secara bawaan; hanya hidup bila operator menyetel KLIRA_PULIHKAN_LEWAT_WEB=1. */
export const pulihkanLewatWebAktif = (env = process.env) => env.KLIRA_PULIHKAN_LEWAT_WEB === '1';
export class CadanganLewatWebMati extends Error {
}
const LOKASI = { unduh: 'Unduhan lewat web', pulihkan: 'Pemulihan lewat web', reset: 'Reset lewat web' };
/**
 * Cadangan sistem bekerja atas seluruh database. Setiap operasi dicatat di log audit SEBELUM dijalankan (gagal mencatat berarti
 * operasi ditolak) dan di riwayat backup. `alat` (fungsi cadangan dari @klira/db) dapat diganti untuk uji.
 */
export function buatLayananCadangan({ repo, audit, lewatWeb = pulihkanLewatWebAktif(), alat = { mulaiUnduhBackup, pulihkanBackup, resetSistem, catatSetelahGantiData } }) {
    const catat = (p, aksi, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi, entitas: 'cadangan', entitas_id: null, keterangan, alamat });
    // Riwayat dan jejak sesudahnya adalah catatan tambahan: kegagalannya tidak boleh menutupi hasil operasi utama.
    const riwayatGagal = (p, lokasi) => repo.catatBackup('gagal', lokasi, p.id).catch(() => undefined);
    const setelahGanti = (d) => alat.catatSetelahGantiData(d).catch((e) => console.error('Gagal mencatat jejak setelah penggantian data', e));
    /** Pulihkan dan reset mengganti seluruh isi database: jejak awal ditulis ke data lama, jejak akhir ke data baru. */
    async function gantiData(p, alamat, lokasi, awal, akhir, jalankan) {
        if (!lewatWeb)
            throw new CadanganLewatWebMati();
        await catat(p, 'perbaikan', awal, alamat);
        let hasil;
        try {
            hasil = await jalankan();
        }
        catch (e) {
            await riwayatGagal(p, lokasi);
            throw e;
        }
        await setelahGanti({ lokasi, keterangan: `${akhir} oleh ${p.username}`, alamat, ukuranByte: hasil?.ukuranByte });
    }
    return {
        lewatWeb,
        /** Aliran dump seluruh database. Riwayat berstatus berjalan sampai aliran tuntas (berhasil) atau putus (gagal). */
        async mulaiUnduh(p, alamat) {
            await catat(p, 'ekspor', 'Unduh cadangan seluruh data', alamat);
            const id = await repo.catatBackup('berjalan', LOKASI.unduh, p.id);
            let ukuran = 0;
            const tandai = (status) => repo.selesaiBackup(id, status, ukuran).catch((e) => console.error('Gagal memperbarui riwayat backup', e));
            let sumber;
            try {
                sumber = await alat.mulaiUnduhBackup();
            }
            catch (e) {
                await tandai('gagal');
                throw e;
            }
            const hitung = new Transform({ transform(potongan, _enc, lanjut) { ukuran += potongan.length; lanjut(null, potongan); } });
            sumber.aliran.pipe(hitung);
            // Berhasil berarti dump selesai DAN seluruh isinya sudah diambil penerima; penerima yang memutus dihitung gagal.
            const selesai = Promise.all([sumber.selesai, finished(hitung)]).then(() => tandai('berhasil'), async (e) => {
                hitung.destroy();
                await tandai('gagal');
                throw e;
            });
            return { aliran: hitung, selesai, batal: () => { sumber.batal(); hitung.destroy(); } };
        },
        pulihkan(p, isi, alamat) {
            return gantiData(p, alamat, LOKASI.pulihkan, 'Pemulihan seluruh data dari berkas cadangan unggahan dimulai', 'Sistem dipulihkan dari cadangan unggahan',
                () => alat.pulihkanBackup(isi, { batasByte: BATAS_UNGGAH_CADANGAN, wajibTanpaPerintahSistem: true }));
        },
        reset(p, alamat) {
            return gantiData(p, alamat, LOKASI.reset, 'Reset sistem (hapus seluruh data) dimulai', 'Sistem direset ke keadaan awal', () => alat.resetSistem());
        },
    };
}
