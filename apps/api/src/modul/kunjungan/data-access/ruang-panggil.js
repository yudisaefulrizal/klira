import * as db from '@klira/db';
import { kodeAntrean } from '@klira/shared';
/** Nama yang diumumkan saat memanggil: nama ruang periksa, ditambah nama poli bila nama ruang belum menyebutnya. */
export const namaPanggil = (poli, ruang) => (!ruang ? `Poli ${poli.nama}` : ruang.nama.toLowerCase().includes(poli.nama.toLowerCase()) ? ruang.nama : `${ruang.nama} · Poli ${poli.nama}`);
/**
 * Pilih ruang periksa untuk antrean yang dipanggil (antrean dibagi per poli, ruang ditetapkan saat dipanggil).
 * - Dokter pilihan pasien yang masih menangani pasien lain: tidak bisa dipanggil (dokter_sibuk).
 * - Poli tanpa ruang periksa: dipanggil tanpa ruang (ruang null).
 * - Ruang pilihan petugas harus ruang poli itu yang aktif dan bebas; tanpa pilihan, ruang terakhir dokter pilihan bila bebas, lalu ruang bebas pertama.
 */
export async function pilihRuangPanggil(fasyankesId, { poliId, sesiId, dpjpId, kecualiId = 0, ruangPilihan }, tx) {
    if (dpjpId) {
        const sibuk = await db.cariAntreanDokterSibuk(fasyankesId, dpjpId, sesiId, kecualiId, tx);
        if (sibuk)
            return { galat: 'dokter_sibuk', kode: kodeAntrean(sibuk.nomor, sibuk.awalan) };
    }
    const semua = await db.daftarRuangPeriksaUntukPoli(fasyankesId, poliId, tx);
    if (!semua.length)
        return ruangPilihan ? { galat: 'ruang_pilihan_tidak_tersedia' } : { ruang: null };
    const aktif = semua.filter((r) => r.status_operasional === 'O');
    if (!aktif.length)
        return { galat: 'ruang_tidak_operasional' };
    const sibuk = new Set((await db.daftarAntreanSibukUntukPetakan(fasyankesId, aktif.map((r) => r.id), sesiId, tx)).filter((a) => a.id !== kecualiId).map((a) => a.ruang_id));
    const bebas = aktif.filter((r) => !sibuk.has(r.id));
    if (ruangPilihan) {
        const r = bebas.find((x) => x.id === ruangPilihan);
        return r ? { ruang: r } : { galat: 'ruang_pilihan_tidak_tersedia' };
    }
    if (!bebas.length)
        return { galat: 'ruang_sibuk' };
    if (dpjpId) {
        const terakhir = await db.cariRuangTerakhirDokter(fasyankesId, dpjpId, sesiId, tx);
        const r = bebas.find((x) => x.id === terakhir);
        if (r)
            return { ruang: r };
    }
    return { ruang: bebas[0] };
}
