import { pathToFileURL as kliraFileUrl } from 'node:url';
import * as db from '../data-access/index.js';
import { hashKataSandi } from '../keamanan/kata-sandi.js';
import { jalankanSeed } from './seed.js';
import { AKUN_DEMO } from '@klira/shared';
export async function seedDemo(env = process.env) {
    if (!['development', 'test'].includes(env.NODE_ENV ?? ''))
        throw new Error('Seed demo hanya diizinkan di development atau test.');
    await jalankanSeed(db.pool, env);
    const fas = await db.ambilFasyankesUntukJalankanSeed('KLINIK-CONTOH');
    if (!fas)
        throw new Error('Klinik contoh tidak ditemukan.');
    const hash = await hashKataSandi(env.KLIRA_SANDI_DEMO || 'admin123');
    return db.transaksi(async (koneksi) => {
        await db.kunciFasyankes(fas.id, koneksi);
        let dibuat = 0;
        for (const akun of AKUN_DEMO) {
            const nik = akun.nik;
            const ada = await db.cariPenggunaDemo(fas.id, akun.username, koneksi);
            if (ada) {
                if (ada.nik !== nik)
                    throw new Error(`Username ${akun.username} sudah dipakai akun lain.`);
                continue;
            }
            const jenis = await db.simpanJenisAkunUntukJalankanSeedHasil(fas.id, akun.jenis, koneksi);
            const id = await db.tambahPenggunaDemo(fas.id, akun.nama, nik, akun.username, hash, koneksi);
            await db.tambahPenugasanJenisUntukSeedPimpinanPertama(fas.id, id, jenis.id, new Date(), koneksi);
            if ('profil' in akun)
                await db.tambahProfilDemo(fas.id, id, akun.profil.profesi, akun.profil.nomor_sip, new Date(`${akun.profil.masa_berlaku_sip}T00:00:00Z`), koneksi);
            await db.tambahLogAuditUntukSeedPimpinanPertama(fas.id, id, 'input', 'pengguna', 'Akun demo dibuat (seed)', koneksi);
            dibuat++;
        }
        return dibuat;
    });
}
if (process.argv[1] && import.meta.url === kliraFileUrl(process.argv[1]).href) {
    seedDemo().then(jumlah => console.log(`${jumlah} akun demo dibuat.`))
        .catch(() => { console.error('Seed demo gagal; periksa konfigurasi dan bentrok akun.'); process.exitCode = 1; })
        .finally(db.tutupPool);
}
