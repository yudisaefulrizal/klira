import { KLINIS, TANDA_VITAL } from '@klira/shared';

/** Tanda vital satu baris, mis. "TD 120/80 · N 88 · S 37.5°C"; "-" bila tidak ada. */
export function ringkasTandaVital(tv) {
    if (!tv) return '-';
    const bagian = [];
    if (tv.sistolik != null && tv.diastolik != null) bagian.push(`TD ${tv.sistolik}/${tv.diastolik}`);
    if (tv.nadi != null) bagian.push(`N ${tv.nadi}`);
    if (tv.respirasi != null) bagian.push(`R ${tv.respirasi}`);
    if (tv.suhu != null) bagian.push(`S ${tv.suhu}°C`);
    if (tv.spo2 != null) bagian.push(`SpO2 ${tv.spo2}%`);
    if (tv.gcs != null) bagian.push(`GCS ${tv.gcs}`);
    if (tv.tinggi_badan != null || tv.berat_badan != null) bagian.push(`TB/BB ${tv.tinggi_badan ?? '-'}/${tv.berat_badan ?? '-'}`);
    if (bagian.length) return bagian.join(' · ');
    return TANDA_VITAL.filter((t) => tv[t.kunci] != null).map((t) => `${KLINIS.tandaVital[t.kunci]} ${tv[t.kunci]}`).join(' · ') || '-';
}

const labelLanjut = (jenis) => KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === jenis)?.label ?? jenis ?? '-';
const teks = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '-');

/** Isi sel tabel untuk satu kunjungan; subjek memakai keluhan utama bila catatan SOAP belum ada. */
export function barisHistori(h) {
    return {
        id: h.id,
        mulai: h.mulai,
        pemeriksa: [h.dpjp_nama, h.poli_nama].filter(Boolean).join(' · ') || '-',
        tandaVital: ringkasTandaVital(h.tanda_vital),
        subjektif: teks(h.subjek) !== '-' ? teks(h.subjek) : teks(h.keluhan_utama),
        objektif: teks(h.objek),
        asesmen: teks(h.asesmen),
        plan: teks(h.plan),
        diagnosis: (h.diagnosis ?? []).map((d) => `${d.kode} ${d.nama}${d.peran === 'utama' ? ' (utama)' : ''}`).join('\n') || '-',
        tindakLanjut: labelLanjut(h.tindak_lanjut),
    };
}
