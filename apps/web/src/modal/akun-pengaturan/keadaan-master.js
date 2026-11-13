import { DEFINISI_MASTER, MASTER, SKEMA_MASTER, SKEMA_MASTER_UBAH } from '@klira/shared';
import { galatSkema } from './keadaan-akun.js';
/** Bidang yang tampil: bidang `hanyaTambah` disembunyikan saat ubah. */
export const bidangTampil = (jenis, ubah) => DEFINISI_MASTER[jenis].bidang.filter((b) => !(ubah && b.hanyaTambah));
const syaratTerpenuhi = (s, nilai) => !!s && (nilai[s.kunci] ?? '') === s.nilai;
/** Bidang yang tampil untuk isian saat ini: bidang bersyarat (`tampilBila`, mis. kode ICD-9-CM tarif tindakan) hanya bila syaratnya terpenuhi. */
export const bidangAktif = (jenis, ubah, nilai) => bidangTampil(jenis, ubah).filter((b) => !b.tampilBila || syaratTerpenuhi(b.tampilBila, nilai));
/** Wajib untuk isian saat ini (`wajibKecuali`: mis. kode dan harga umum tidak wajib untuk tarif tindakan). */
export const wajibSaatIni = (b, nilai) => !!b.wajib && !syaratTerpenuhi(b.wajibKecuali, nilai);
/** Petunjuk bidang untuk isian saat ini (petunjuk pengganti saat pengecualian wajib berlaku). */
export const petunjukSaatIni = (b, nilai) => (b.petunjukKecuali && syaratTerpenuhi(b.wajibKecuali, nilai) ? b.petunjukKecuali : b.petunjuk);
/** Isian awal: baris yang diubah, atau nilai awal bidang (kosong bila tidak ada). */
export function awalMaster(jenis, baris) {
    const nilai = {};
    for (const b of bidangTampil(jenis, baris !== undefined)) {
        const v = baris ? baris[b.kunci] : undefined;
        nilai[b.kunci] = baris ? (v === null || v === undefined ? '' : String(v)) : (b.nilaiAwal ?? '');
    }
    return nilai;
}
const kosong = (t) => t.trim() === '';
/** Ubah isian teks menjadi masukan skema bersama (angka, id, tanggal; kosong menjadi tidak ada). */
export function bentukMasukan(jenis, nilai, ubah) {
    const hasil = {};
    for (const b of bidangAktif(jenis, ubah, nilai)) {
        const t = (nilai[b.kunci] ?? '').trim();
        if (b.tipe === 'teks' || b.tipe === 'icd9cm') {
            if (wajibSaatIni(b, nilai) || t !== '')
                hasil[b.kunci] = t;
        }
        else if (!kosong(t)) {
            hasil[b.kunci] = b.tipe === 'angka' || b.tipe === 'rujukan' || b.numerik ? Number(t) : t;
        }
    }
    return hasil;
}
/** Galat per bidang dari skema bersama; bidang wajib kosong selalu memakai pesan wajib diisi. */
export function galatMaster(jenis, nilai, ubah) {
    const skema = ubah ? SKEMA_MASTER_UBAH[jenis] : SKEMA_MASTER[jenis];
    const galat = galatSkema(skema, bentukMasukan(jenis, nilai, ubah));
    for (const k of Object.keys(galat))
        if (!bidangAktif(jenis, ubah, nilai).some((b) => b.kunci === k) && k !== '_')
            delete galat[k];
    for (const b of bidangAktif(jenis, ubah, nilai)) {
        if (wajibSaatIni(b, nilai) && kosong(nilai[b.kunci] ?? '')) {
            galat[b.kunci] = jenis === 'bed' && b.kunci === 'induk_id' ? MASTER.galat.indukBed : b.tipe === 'icd9cm' ? MASTER.galat.icd9Wajib : MASTER.galat.wajib;
        }
    }
    return galat;
}
export const masterBerubah = (awal, nilai) => Object.keys(awal).some((k) => (awal[k] ?? '').trim() !== (nilai[k] ?? '').trim());
const KUNCI_NAMA = { pengguna_id: 'pengguna_nama', lokasi_id: 'lokasi_nama', induk_id: 'induk_nama' };
/** Opsi rujukan ditambah nilai saat ini (mis. praktisi yang sudah nonaktif) agar pilihan tersimpan tidak hilang. */
export function opsiDenganNilaiSaatIni(opsi, kunci, baris) {
    const nilai = baris?.[kunci];
    if (nilai === null || nilai === undefined || nilai === '' || opsi.some((o) => o.nilai === String(nilai)))
        return [...opsi];
    const nama = baris?.[KUNCI_NAMA[kunci] ?? ''];
    return [{ nilai: String(nilai), label: typeof nama === 'string' ? nama : String(nilai) }, ...opsi];
}
