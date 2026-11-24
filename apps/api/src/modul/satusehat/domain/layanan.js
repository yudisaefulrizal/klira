import { buatKlienSatusehat } from '@klira/integrasi';
import { dekripsiRahasia, enkripsiRahasia } from '@klira/db';
import { PENGATURAN_SATUSEHAT as S } from '@klira/shared';

export const URL_RESMI = {
    sandbox: 'https://api-satusehat-stg.dto.kemkes.go.id',
    produksi: 'https://api-satusehat.kemkes.go.id',
};
const alamatBersih = (v) => (v ? v.trim().replace(/\/+$/, '') : null);

/**
 * Alamat kustom (mis. server tiruan lokal) hanya untuk lingkungan sandbox dan wajib http/https.
 * Produksi selalu https; di luar pengembangan, alamat kustom butuh izin eksplisit dari operator server
 * (SATUSEHAT_IZINKAN_URL_KUSTOM=1) karena kredensial klinik dikirim ke alamat itu.
 */
export function periksaAlamat(alamat, environment, { nodeEnv = 'development', izinKustom = false, resmi = URL_RESMI, pesan = S.galat } = {}) {
    const bersih = alamatBersih(alamat);
    if (!bersih)
        return { ok: true, alamat: null };
    let url;
    try {
        url = new URL(bersih);
    }
    catch {
        return { ok: false, pesan: pesan.alamat };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
        return { ok: false, pesan: pesan.alamatKustom };
    if (environment === 'produksi' && url.protocol !== 'https:')
        return { ok: false, pesan: pesan.alamatProduksi };
    if (nodeEnv === 'production' && !izinKustom && bersih !== resmi[environment])
        return { ok: false, pesan: pesan.alamatKustom };
    return { ok: true, alamat: bersih };
}

/** Bentuk keluaran tanpa rahasia: hanya penanda bahwa rahasia tersimpan. */
const keDto = (k) => ({
    environment: k.environment,
    client_id: k.client_id,
    client_secret_terisi: Boolean(k.client_secret_terenkripsi),
    base_url: k.base_url ?? null,
    base_url_efektif: k.base_url ?? URL_RESMI[k.environment],
    aktif: Boolean(k.aktif),
    diuji_pada: k.diuji_pada ? new Date(k.diuji_pada).toISOString() : null,
    hasil_uji: k.hasil_uji ?? null,
});

export function buatLayananSatusehat({ repo, audit, buatKlien = buatKlienSatusehat, enkripsi = enkripsiRahasia, dekripsi = dekripsiRahasia, nodeEnv = process.env.NODE_ENV, izinUrlKustom = process.env.SATUSEHAT_IZINKAN_URL_KUSTOM === '1', sekarang = () => new Date() }) {
    const pilihan = { nodeEnv: nodeEnv || 'development', izinKustom: izinUrlKustom };
    const klienDari = (k, organizationId, tambahan = {}) => buatKlien({
        baseUrl: k.base_url ?? URL_RESMI[k.environment],
        clientId: k.client_id,
        clientSecret: dekripsi(k.client_secret_terenkripsi),
        organizationId,
        ...tambahan,
    });
    return {
        async ambil(p) {
            const [daftar, organizationId] = await Promise.all([repo.daftar(), repo.organizationId()]);
            const urut = new Map(daftar.map((k) => [k.environment, keDto(k)]));
            return {
                organization_id: organizationId,
                aktif: daftar.find((k) => k.aktif)?.environment ?? null,
                lingkungan: ['sandbox', 'produksi'].map((e) => urut.get(e) ?? { environment: e, client_id: '', client_secret_terisi: false, base_url: null, base_url_efektif: URL_RESMI[e], aktif: false, diuji_pada: null, hasil_uji: null }),
            };
        },
        async simpan(p, m, alamat) {
            const cek = periksaAlamat(m.base_url, m.environment, pilihan);
            if (!cek.ok)
                return { ok: false, kode: 'tidak_valid', pesan: cek.pesan, bidang: 'base_url' };
            const ada = await repo.ambil(m.environment);
            if (!ada && !m.client_secret)
                return { ok: false, kode: 'tidak_valid', pesan: S.galat.rahasiaWajib, bidang: 'client_secret' };
            const rahasia = m.client_secret ? enkripsi(m.client_secret) : null;
            if (ada)
                await repo.ubah(ada.id, { client_id: m.client_id, client_secret_terenkripsi: rahasia, base_url: cek.alamat });
            else
                await repo.tambah({ environment: m.environment, client_id: m.client_id, client_secret_terenkripsi: rahasia, base_url: cek.alamat }, p.id);
            const baru = await repo.ambil(m.environment);
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kredensial_satusehat', entitas_id: baru.id,
                keterangan: `Kredensial SATUSEHAT ${m.environment} ${ada ? 'diubah' : 'disimpan'}${m.client_secret ? ' (rahasia diganti)' : ''}`, alamat,
            });
            return { ok: true, data: keDto(baru) };
        },
        async aktifkan(p, environment, alamat) {
            const k = await repo.ambil(environment);
            if (!k)
                return { ok: false, kode: 'belum_lengkap', pesan: S.galat.belumAda };
            if (!(await repo.organizationId()))
                return { ok: false, kode: 'belum_lengkap', pesan: S.galat.organisasiKosong };
            await repo.aktifkan(k.id);
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kredensial_satusehat', entitas_id: k.id,
                keterangan: `Lingkungan SATUSEHAT aktif: ${environment}`, alamat,
            });
            return { ok: true, data: keDto({ ...k, aktif: true }) };
        },
        /** Uji koneksi satu lingkungan: ambil token lalu baca Organization klinik. Hasilnya disimpan agar terlihat di layar. */
        async uji(p, environment) {
            const k = await repo.ambil(environment);
            if (!k)
                return { ok: false, kode: 'belum_lengkap', pesan: S.galat.belumAda };
            const organizationId = await repo.organizationId();
            if (!organizationId)
                return { ok: false, kode: 'belum_lengkap', pesan: S.galat.organisasiKosong };
            let hasil;
            try {
                const r = await klienDari(k, organizationId).uji();
                hasil = { ok: true, ringkas: S.ujiBerhasil(r.organisasi.nama) };
            }
            catch (galat) {
                hasil = { ok: false, ringkas: S.ujiGagal(galat?.name === 'GalatIntegrasi' ? galat.message : 'kesalahan tak terduga') };
            }
            await repo.catatUji(k.id, hasil.ringkas, sekarang());
            const baru = await repo.ambil(environment);
            return { ok: true, data: { berhasil: hasil.ok, pesan: hasil.ringkas, konfigurasi: keDto(baru) } };
        },
        /** Untuk modul lain (mis. pencarian pasien): klien lingkungan aktif, atau null bila belum dikonfigurasi. */
        async klienAktif(tambahan = {}) {
            const [k, organizationId] = await Promise.all([repo.ambilAktif(), repo.organizationId()]);
            if (!k || !organizationId)
                return null;
            return { environment: k.environment, organizationId, klien: klienDari(k, organizationId, tambahan) };
        },
    };
}
