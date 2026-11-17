import { pathToFileURL as kliraFileUrl } from 'node:url';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tutupPool } from '../../koneksi.js';
import { daftarIdFasyankes } from '../../data-access/fasyankes.js';
import { tambahLogAuditUntukTambah } from '../../data-access/log_audit.js';
import { tambahRiwayatBackup } from '../../data-access/riwayat_backup.js';
import { GalatFasyankesGanda, pastikanFasyankesTunggal } from '../../fasyankes-tunggal.js';
import { buatCadanganKeBerkas, catatSetelahGantiData, pulihkanBackup } from '../index.js';
const PEMAKAIAN = 'Pemakaian: cadangan buat <berkas.sql> | pulihkan <berkas.sql> --ya';
/** Cadangan dan pemulihan oleh operator di server. Pemulihan menghapus seluruh data, jadi wajib ditegaskan dengan --ya. */
export async function jalankanCadangan(args, tulis = console.log) {
    const [perintah, berkasArg, ...sisa] = args;
    if (!['buat', 'pulihkan'].includes(perintah) || !berkasArg)
        throw new Error(PEMAKAIAN);
    const berkas = resolve(berkasArg);
    if (perintah === 'buat') {
        if (sisa.length)
            throw new Error(PEMAKAIAN);
        const ukuranByte = await buatCadanganKeBerkas(berkas);
        const [fasyankesId = null] = await daftarIdFasyankes(1);
        await tambahLogAuditUntukTambah(fasyankesId, null, 'ekspor', 'cadangan', null, 'Cadangan seluruh data dibuat lewat perintah operator', new Date(), 'cli');
        if (fasyankesId !== null)
            await tambahRiwayatBackup(fasyankesId, 'berhasil', `Berkas di server: ${berkas}`.slice(0, 500), null, ukuranByte);
        tulis(`Cadangan tersimpan: ${berkas} (${ukuranByte} byte). Berkas berisi data pasien; simpan terenkripsi dan di luar server ini.`);
        return;
    }
    if (sisa.length !== 1 || sisa[0] !== '--ya')
        throw new Error(`Pemulihan menghapus SELURUH data saat ini dan menggantinya dengan isi berkas. Tegaskan dengan --ya.\n${PEMAKAIAN}`);
    const { size } = await stat(berkas);
    const { ukuranByte } = await pulihkanBackup(createReadStream(berkas));
    await catatSetelahGantiData({ lokasi: 'Pemulihan lewat perintah operator', keterangan: `Sistem dipulihkan dari berkas cadangan lewat perintah operator (${size} byte)`, alamat: 'cli', ukuranByte });
    tulis(`Database dipulihkan dari ${berkas}. Jalankan migrasi (terapkan) bila cadangan berasal dari versi lebih lama, lalu mulai ulang aplikasi.`);
    try {
        await pastikanFasyankesTunggal();
    }
    catch (galat) {
        if (!(galat instanceof GalatFasyankesGanda))
            throw galat;
        tulis(`Peringatan: ${galat.message}`);
    }
}
if (process.argv[1] && import.meta.url === kliraFileUrl(process.argv[1]).href) {
    jalankanCadangan(process.argv.slice(2))
        .catch(galat => { console.error(galat instanceof Error ? galat.message : 'Cadangan gagal.'); process.exitCode = 1; })
        .finally(tutupPool);
}
