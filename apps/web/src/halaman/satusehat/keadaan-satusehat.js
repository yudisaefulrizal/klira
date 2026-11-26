import { PENGATURAN_SATUSEHAT as S } from '@klira/shared';

/** Hasil uji berupa teks; berhasil bila diawali "Terhubung". */
export const ujiBerhasil = (hasil) => typeof hasil === 'string' && hasil.startsWith('Terhubung');

/** Baris label-nilai kartu koneksi dari DTO API. Rahasia tidak pernah dikirim ke layar. */
export function barisKoneksi(k) {
    const H = S.halaman;
    return [
        [H.lingkunganJudul, H.lingkungan[k.environment]],
        [H.alamat, k.base_url],
        [H.organisasi, k.organization_id ?? H.belumTerisi],
        [H.clientId, k.client_id || H.belumTerisi],
        [H.clientSecret, k.client_secret_terisi ? H.terisi : H.belumTerisi],
    ];
}

/** Ringkasan status IHS untuk petugas pendaftaran; null bila tidak perlu ditampilkan (hanya yang butuh perhatian). */
export function ringkasStatusIhs(s) {
    if (!s || s.status === 'sudah' || s.status === 'terhubung')
        return s?.status === 'terhubung' ? { nada: 'hijau', teks: S.halaman.status.terhubung } : null;
    if (s.status === 'dilewati' && s.alasan === 'belum_dikonfigurasi')
        return null;
    return { nada: s.status === 'gagal' ? 'merah' : 'kuning', teks: s.pesan || S.halaman.status[s.status] || S.halaman.status.gagal };
}
