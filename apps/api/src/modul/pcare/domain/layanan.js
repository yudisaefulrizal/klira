import { buatKlienPcare } from '@klira/integrasi';
import { dekripsiRahasia, enkripsiRahasia } from '@klira/db';
import { PENGATURAN_PCARE as P } from '@klira/shared';
import { periksaAlamat } from '../../satusehat/domain/layanan.js';

/** Alamat resmi BPJS per lingkungan; alamat kosong di konfigurasi memakai nilai ini. */
export const URL_RESMI_PCARE = {
    sandbox: 'https://apijkn-dev.bpjs-kesehatan.go.id',
    produksi: 'https://apijkn.bpjs-kesehatan.go.id',
};
const RAHASIA = ['secret_key', 'user_key', 'password'];

/** Bentuk keluaran tanpa rahasia: hanya penanda bahwa tiap rahasia tersimpan. */
const keDto = (k) => ({
    environment: k.environment,
    cons_id: k.cons_id,
    username: k.username,
    app_code: k.app_code,
    service_name: k.service_name,
    base_url: k.base_url ?? null,
    base_url_efektif: k.base_url ?? URL_RESMI_PCARE[k.environment],
    secret_key_terisi: Boolean(k.secret_key_terenkripsi),
    user_key_terisi: Boolean(k.user_key_terenkripsi),
    password_terisi: Boolean(k.password_terenkripsi),
    aktif: Boolean(k.aktif),
    diuji_pada: k.diuji_pada ? new Date(k.diuji_pada).toISOString() : null,
    hasil_uji: k.hasil_uji ?? null,
});
const kosong = (environment) => ({
    environment, cons_id: '', username: '', app_code: '', service_name: 'pcare-rest', base_url: null, base_url_efektif: URL_RESMI_PCARE[environment],
    secret_key_terisi: false, user_key_terisi: false, password_terisi: false, aktif: false, diuji_pada: null, hasil_uji: null,
});

export function buatLayananPcare({ repo, audit, buatKlien = buatKlienPcare, enkripsi = enkripsiRahasia, dekripsi = dekripsiRahasia, nodeEnv = process.env.NODE_ENV, izinUrlKustom = process.env.PCARE_IZINKAN_URL_KUSTOM === '1', sekarang = () => new Date() }) {
    const pilihan = { nodeEnv: nodeEnv || 'development', izinKustom: izinUrlKustom, resmi: URL_RESMI_PCARE, pesan: P.galat };
    const klienDari = (k, tambahan = {}) => buatKlien({
        baseUrl: k.base_url ?? URL_RESMI_PCARE[k.environment], serviceName: k.service_name, consId: k.cons_id, userKey: dekripsi(k.user_key_terenkripsi),
        secretKey: dekripsi(k.secret_key_terenkripsi), username: k.username, password: dekripsi(k.password_terenkripsi), appCode: k.app_code, ...tambahan,
    });
    return {
        async ambil(p) {
            const daftar = await repo.daftar(p.fasyankes_id);
            const urut = new Map(daftar.map((k) => [k.environment, keDto(k)]));
            return { aktif: daftar.find((k) => k.aktif)?.environment ?? null, lingkungan: ['sandbox', 'produksi'].map((e) => urut.get(e) ?? kosong(e)) };
        },
        async simpan(p, m, alamat) {
            const cek = periksaAlamat(m.base_url, m.environment, pilihan);
            if (!cek.ok)
                return { ok: false, kode: 'tidak_valid', pesan: cek.pesan, bidang: 'base_url' };
            const ada = await repo.ambil(p.fasyankes_id, m.environment);
            if (!ada) {
                const kurang = RAHASIA.find((r) => !m[r]);
                if (kurang)
                    return { ok: false, kode: 'tidak_valid', pesan: P.galat.rahasiaWajib(P.rahasia[kurang]), bidang: kurang };
            }
            const data = {
                environment: m.environment, cons_id: m.cons_id, username: m.username, app_code: m.app_code, service_name: m.service_name, base_url: cek.alamat,
                secret_key_terenkripsi: m.secret_key ? enkripsi(m.secret_key) : null,
                user_key_terenkripsi: m.user_key ? enkripsi(m.user_key) : null,
                password_terenkripsi: m.password ? enkripsi(m.password) : null,
            };
            if (ada)
                await repo.ubah(ada.id, data);
            else
                await repo.tambah(p.fasyankes_id, data, p.id);
            const baru = await repo.ambil(p.fasyankes_id, m.environment);
            const diganti = RAHASIA.filter((r) => m[r]);
            await audit.catat({
                fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kredensial_pcare', entitas_id: baru.id,
                keterangan: `Kredensial PCare ${m.environment} ${ada ? 'diubah' : 'disimpan'}${diganti.length ? ` (rahasia diganti: ${diganti.join(', ')})` : ''}`, alamat,
            });
            return { ok: true, data: keDto(baru) };
        },
        async aktifkan(p, environment, alamat) {
            const k = await repo.ambil(p.fasyankes_id, environment);
            if (!k)
                return { ok: false, kode: 'belum_lengkap', pesan: P.galat.belumAda };
            await repo.aktifkan(p.fasyankes_id, k.id);
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kredensial_pcare', entitas_id: k.id, keterangan: `Lingkungan PCare aktif: ${environment}`, alamat });
            return { ok: true, data: keDto({ ...k, aktif: true }) };
        },
        /** Uji koneksi satu lingkungan; hasilnya disimpan agar terlihat di layar. */
        async uji(p, environment) {
            const k = await repo.ambil(p.fasyankes_id, environment);
            if (!k)
                return { ok: false, kode: 'belum_lengkap', pesan: P.galat.belumAda };
            let hasil;
            try {
                await klienDari(k).uji();
                hasil = { ok: true, ringkas: P.ujiBerhasil };
            }
            catch (galat) {
                hasil = { ok: false, ringkas: P.ujiGagal(galat?.name === 'GalatIntegrasi' ? galat.message : 'kesalahan tak terduga') };
            }
            await repo.catatUji(k.id, hasil.ringkas, sekarang());
            const baru = await repo.ambil(p.fasyankes_id, environment);
            return { ok: true, data: { berhasil: hasil.ok, pesan: hasil.ringkas, konfigurasi: keDto(baru) } };
        },
        /** Untuk modul lain: klien lingkungan aktif, atau null bila belum dikonfigurasi. */
        async klienAktif(fasyankesId, tambahan = {}) {
            const k = await repo.ambilAktif(fasyankesId);
            return k ? { environment: k.environment, klien: klienDari(k, tambahan) } : null;
        },
    };
}
