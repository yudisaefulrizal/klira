import { buatKlienSatusehat } from '@klira/integrasi';
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

/** Nama variabel .env yang wajib terisi; alamat boleh kosong (memakai sandbox resmi). */
export const VARIABEL_WAJIB = ['SATUSEHAT_ORGANIZATION_ID', 'SATUSEHAT_CLIENT_ID', 'SATUSEHAT_CLIENT_SECRET'];
const HOST_PRODUKSI = new URL(URL_RESMI.produksi).hostname;

/**
 * Konfigurasi SATUSEHAT hanya dibaca dari variabel lingkungan server (.env), tidak pernah disimpan di database.
 * Lingkungan ditentukan alamatnya: host resmi produksi berarti produksi, selain itu sandbox.
 */
export function bacaKonfigurasi(env) {
    const nilai = (nama) => String(env[nama] ?? '').trim();
    const alamat = alamatBersih(nilai('SATUSEHAT_BASE_URL')) ?? URL_RESMI.sandbox;
    let environment = 'sandbox';
    try {
        if (new URL(alamat).hostname === HOST_PRODUKSI)
            environment = 'produksi';
    }
    catch {
        // Alamat tidak sah ditangani periksaAlamat di bawah.
    }
    const kurang = VARIABEL_WAJIB.filter((nama) => !nilai(nama));
    const cek = periksaAlamat(alamat, environment);
    return {
        environment,
        baseUrl: alamat,
        organizationId: nilai('SATUSEHAT_ORGANIZATION_ID') || null,
        clientId: nilai('SATUSEHAT_CLIENT_ID'),
        clientSecret: nilai('SATUSEHAT_CLIENT_SECRET'),
        kurang,
        galatAlamat: cek.ok ? null : cek.pesan,
        lengkap: kurang.length === 0 && cek.ok,
    };
}

export function buatLayananSatusehat({ env = process.env, buatKlien = buatKlienSatusehat, sekarang = () => new Date() } = {}) {
    // Hasil uji terakhir hanya disimpan di memori; hilang saat server dimulai ulang.
    let ujiTerakhir = null;
    const klienDari = (k, tambahan = {}) => buatKlien({
        baseUrl: k.baseUrl,
        clientId: k.clientId,
        clientSecret: k.clientSecret,
        organizationId: k.organizationId,
        ...tambahan,
    });
    const masalah = (k) => (k.kurang.length ? S.galat.envKurang(k.kurang) : k.galatAlamat);
    /** Bentuk keluaran tanpa rahasia: hanya penanda bahwa rahasia terisi. */
    const keDto = () => {
        const k = bacaKonfigurasi(env);
        return {
            organization_id: k.organizationId,
            aktif: k.lengkap ? k.environment : null,
            environment: k.environment,
            client_id: k.clientId,
            client_secret_terisi: Boolean(k.clientSecret),
            base_url: k.baseUrl,
            kurang: k.kurang,
            masalah: masalah(k),
            diuji_pada: ujiTerakhir?.waktu.toISOString() ?? null,
            hasil_uji: ujiTerakhir?.ringkas ?? null,
        };
    };
    return {
        async ambil() {
            return keDto();
        },
        /** Uji koneksi: ambil token lalu baca Organization klinik. */
        async uji() {
            const k = bacaKonfigurasi(env);
            if (!k.lengkap)
                return { ok: false, kode: 'belum_lengkap', pesan: masalah(k) };
            let hasil;
            try {
                const r = await klienDari(k).uji();
                hasil = { ok: true, ringkas: S.ujiBerhasil(r.organisasi.nama) };
            }
            catch (galat) {
                hasil = { ok: false, ringkas: S.ujiGagal(galat?.name === 'GalatIntegrasi' ? galat.message : 'kesalahan tak terduga') };
            }
            ujiTerakhir = { ringkas: hasil.ringkas, waktu: sekarang() };
            return { ok: true, data: { berhasil: hasil.ok, pesan: hasil.ringkas, konfigurasi: keDto() } };
        },
        /** Untuk modul lain (mis. pencarian pasien): klien dari .env, atau null bila belum lengkap. */
        async klienAktif(tambahan = {}) {
            const k = bacaKonfigurasi(env);
            if (!k.lengkap)
                return null;
            return { environment: k.environment, organizationId: k.organizationId, klien: klienDari(k, tambahan) };
        },
    };
}
