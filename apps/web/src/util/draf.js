const VERSI = 1;
export const AWALAN_DRAF = 'klira.draf.';
/** Masa berlaku bawaan draf (komputer klinik bersama). */
export const KEDALUWARSA_DRAF_MS = 30 * 60 * 1000;
/** Salinan nilai tanpa bidang sensitif (tingkat atas) agar tidak pernah masuk penyimpanan lokal. */
export function saringSensitif(nilai, sensitif = []) {
    if (!sensitif.length || nilai === null || typeof nilai !== 'object')
        return nilai;
    return Object.fromEntries(Object.entries(nilai).filter(([k]) => !sensitif.includes(k)));
}
/** Hapus semua draf `klira.draf.*` (saat keluar atau pengguna berganti). */
export function hapusSemuaDraf(simpanan) {
    try {
        if (!simpanan || simpanan.key === undefined || simpanan.length === undefined)
            return;
        const kunci = [];
        for (let i = 0; i < simpanan.length; i++) {
            const k = simpanan.key(i);
            if (k?.startsWith(AWALAN_DRAF))
                kunci.push(k);
        }
        kunci.forEach((k) => simpanan.removeItem(k));
    }
    catch {
        /* diabaikan */
    }
}
/** Kunci draf per alur dan per pemilik akun, mis. `klira.draf.pembuatan-akun.12`. */
export const kunciDraf = (alur, pemilikId) => `${AWALAN_DRAF}${alur}${pemilikId != null ? `.${pemilikId}` : ''}`;
/** Draf tersimpan, atau null bila tidak ada, rusak, atau versinya berbeda. */
export function bacaDraf(kunci, simpanan, opsi = {}) {
    try {
        const mentah = simpanan?.getItem(kunci);
        if (!mentah)
            return null;
        const d = JSON.parse(mentah);
        if (!(d && d.versi === VERSI && typeof d.langkah === 'number' && 'nilai' in d))
            return null;
        const umur = (opsi.sekarang ?? (() => new Date()))().getTime() - Date.parse(d.disimpan);
        if (!(umur <= (opsi.kedaluwarsaMs ?? KEDALUWARSA_DRAF_MS))) {
            hapusDraf(kunci, simpanan);
            return null;
        }
        return d;
    }
    catch {
        return null;
    }
}
export function simpanDraf(kunci, nilai, langkah, simpanan, sekarang = () => new Date()) {
    try {
        simpanan?.setItem(kunci, JSON.stringify({ versi: VERSI, disimpan: sekarang().toISOString(), langkah, nilai }));
        return !!simpanan;
    }
    catch {
        return false; // penyimpanan penuh atau ditolak: isian tetap di layar
    }
}
export function hapusDraf(kunci, simpanan) {
    try {
        simpanan?.removeItem(kunci);
    }
    catch {
        /* diabaikan */
    }
}
/** Penyimpan di penyimpanan lokal peramban: hanya untuk alur tanpa data kesehatan. */
export function adaptorLokal(kunci, opsi = {}) {
    const simpanan = 'simpanan' in opsi ? opsi.simpanan : typeof localStorage === 'undefined' ? null : localStorage;
    return {
        baca: () => bacaDraf(kunci, simpanan, { kedaluwarsaMs: opsi.kedaluwarsaMs }),
        simpan: (nilai, langkah) => void simpanDraf(kunci, saringSensitif(nilai, opsi.sensitif), langkah, simpanan),
        hapus: () => hapusDraf(kunci, simpanan),
        saring: (nilai) => saringSensitif(nilai, opsi.sensitif),
    };
}
/** Awalan kunci draf lokal lama alur klinis (sebelum draf pindah ke server). */
export const AWALAN_DRAF_KLINIS_LAMA = [`${AWALAN_DRAF}pemeriksaan-klinis`, `${AWALAN_DRAF}skrining`];
/** Buang sisa draf klinis dari penyimpanan lokal (hanya menghapus, tidak pernah menulis). */
export function hapusDrafKlinisLama(simpanan = typeof localStorage === 'undefined' ? null : localStorage) {
    try {
        if (!simpanan || simpanan.key === undefined || simpanan.length === undefined)
            return;
        const kunci = [];
        for (let i = 0; i < simpanan.length; i++) {
            const k = simpanan.key(i);
            if (k && AWALAN_DRAF_KLINIS_LAMA.some((a) => k.startsWith(a)))
                kunci.push(k);
        }
        kunci.forEach((k) => simpanan.removeItem(k));
    }
    catch {
        /* diabaikan */
    }
}
/** Isian berubah dari keadaan awal? Dasar perlindungan tutup tak sengaja. */
export const adaPerubahan = (awal, kini) => JSON.stringify(awal) !== JSON.stringify(kini);
