import icd10 from '../data/icd10-2010.json' with { type: 'json' };
import icd9cm from '../data/icd9cm-2010.json' with { type: 'json' };
import indonesia from '../data/icd10-padanan-id.json' with { type: 'json' };
import kptl from '../data/icd9cm-kptl-id.json' with { type: 'json' };
export const sistemIcd = (sistem) => sistem === 'icd10' || sistem === 'icd9cm';
// JSON ikut disalin oleh tsc ke dist; dimuat sekali, tanpa query DB atau unduhan saat digunakan.
const padanan = indonesia.sha256_berkas_primer === icd10.sha256_primer ? indonesia.padanan : {};
const namaKptl = kptl.sha256_berkas_primer === icd9cm.sha256_primer ? kptl.padanan : {};
const buatDaftar = (sistem, data) => data.kode.map((k) => ({ sistem, kode: k.kode, nama: k.nama, contoh: false, ...(sistem === 'icd10' && padanan[k.kode] ? { nama_indonesia: padanan[k.kode], status_padanan: 'komunitas' } : {}), ...(sistem === 'icd9cm' && namaKptl[k.kode] ? { nama_tindakan_kptl: namaKptl[k.kode] } : {}) }));
const referensi = { icd10: buatDaftar('icd10', icd10), icd9cm: buatDaftar('icd9cm', icd9cm) };
export function kamusIcd(q) {
    const awalan = q.awalan?.toUpperCase();
    const daftar = awalan ? referensi[q.sistem].filter((k) => k.kode.startsWith(awalan)) : referensi[q.sistem];
    const mulai = (q.halaman - 1) * q.ukuran;
    return { data: daftar.slice(mulai, mulai + q.ukuran), total: daftar.length, halaman: q.halaman, ukuran: q.ukuran };
}
/** Urutan saran tetap: awalan kode, awalan nama, lalu nama memuat kata. */
export function cariIcd(sistem, kata, batas) {
    const q = kata.trim().toLowerCase();
    if (!q)
        return [];
    const kode = [], namaAwal = [], namaMemuat = [];
    for (const k of referensi[sistem]) {
        const nama = k.nama.toLowerCase();
        const alias = [k.nama_indonesia ?? '', ...(k.nama_tindakan_kptl?.map((n) => n.nama) ?? [])].map((n) => n.toLowerCase());
        if (k.kode.toLowerCase().startsWith(q))
            kode.push(k);
        else if (nama.startsWith(q) || alias.some((n) => n.startsWith(q)))
            namaAwal.push(k);
        else if (nama.includes(q) || alias.some((n) => n.includes(q)))
            namaMemuat.push(k);
    }
    return [...kode, ...namaAwal, ...namaMemuat].slice(0, batas);
}
const indeksKode = { icd10: new Map(referensi.icd10.map((k) => [k.kode, k])), icd9cm: new Map(referensi.icd9cm.map((k) => [k.kode, k])) };
/** Entri kamus untuk kode persis (null bila tidak ada); dipakai validasi kode tindakan klinik. */
export const entriIcd = (sistem, kode) => indeksKode[sistem].get(kode.trim().toUpperCase()) ?? null;
