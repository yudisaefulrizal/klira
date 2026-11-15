import { PENGATURAN_SATUSEHAT as S, konfigurasiSatusehatMasukan } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun.js';

/** Isian awal satu lingkungan dari DTO API. Rahasia tidak pernah dikirim ke layar, jadi isiannya selalu kosong. */
export const formDariLingkungan = (l) => ({ environment: l.environment, client_id: l.client_id ?? '', client_secret: '', base_url: l.base_url ?? '' });

const opsional = (t) => (t.trim() === '' ? undefined : t.trim());

/** Badan permintaan simpan: rahasia dan alamat kosong dihilangkan (rahasia kosong berarti tetap memakai yang tersimpan). */
export const bentukKonfigurasi = (f) => ({
    environment: f.environment, client_id: f.client_id.trim(), client_secret: opsional(f.client_secret), base_url: opsional(f.base_url),
});

/** Galat per bidang; lingkungan baru (rahasia belum tersimpan) wajib mengisi rahasia. */
export function galatKonfigurasi(f, rahasiaTerisi) {
    const g = galatSkema(konfigurasiSatusehatMasukan, bentukKonfigurasi(f));
    if (!rahasiaTerisi && f.client_secret.trim() === '' && !g.client_secret)
        g.client_secret = S.galat.rahasiaWajib;
    return g;
}

export const konfigurasiBerubah = (awal, f) => ['client_id', 'client_secret', 'base_url'].some((k) => awal[k].trim() !== f[k].trim());

/** Hasil uji tersimpan sebagai teks; berhasil bila diawali "Terhubung". */
export const ujiBerhasil = (hasil) => typeof hasil === 'string' && hasil.startsWith('Terhubung');

/** Tombol yang boleh tampil untuk satu lingkungan. */
export function aksiTersedia(l, { bolehUbah, organisasiAda }) {
    const tersimpan = l.client_secret_terisi && l.client_id !== '';
    return {
        simpan: bolehUbah,
        uji: bolehUbah && tersimpan && organisasiAda,
        aktifkan: bolehUbah && tersimpan && organisasiAda && !l.aktif,
    };
}

/** Ringkasan status IHS untuk petugas pendaftaran; null bila tidak perlu ditampilkan (hanya yang butuh perhatian). */
export function ringkasStatusIhs(s) {
    if (!s || s.status === 'sudah' || s.status === 'terhubung')
        return s?.status === 'terhubung' ? { nada: 'hijau', teks: S.halaman.status.terhubung } : null;
    if (s.status === 'dilewati' && s.alasan === 'belum_dikonfigurasi')
        return null;
    return { nada: s.status === 'gagal' ? 'merah' : 'kuning', teks: s.pesan || S.halaman.status[s.status] || S.halaman.status.gagal };
}
